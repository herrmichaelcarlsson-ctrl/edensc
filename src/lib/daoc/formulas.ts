/**
 * Formula engine for Eden Template Forge.
 *
 * All numeric weights/tables live in the `formula_config` Postgres table
 * (seeded with the values from the project spec). Admins can override them
 * via /admin/formulas without redeploying. This file provides:
 *
 *   - DEFAULT_* constants matching the seeded DB values (used as fallback
 *     when DB hasn't loaded yet)
 *   - Pure functions:
 *       calcUtility()       (DAoC-style utility score)
 *       calcGearScore()     (utility + ToA + charges − waste)
 *       calcImbueUsed()     (highest gem + (rest)/2)
 *       calcOvercharge()    (used − safe cap)
 *       calcFailRisk()      (risk table + quality + skill modifiers)
 *       riskLabel()         (Safe / Moderate / Risky / Very Risky / Extreme)
 *
 * Source for default formulas: project spec ("EXACT CALCULATION ENGINE" section)
 * + Sarouk DAoC Spellcrafting guide (https://www.sarouk.net/daoc/spellcrafting.html).
 */

import type { AggregateResult } from "./aggregate";
import { CAPS } from "./caps";

/* ============================================================
 * Default config (matches DB seed in formula_config table)
 * ============================================================ */

export interface UtilityWeights {
  stat: number;     // per +1 stat point
  hits: number;     // per +1 hp
  power: number;    // per +1% power
  resist: number;   // per +1% resist
  skill: number;    // per +1 skill
}
export const DEFAULT_UTILITY: UtilityWeights = {
  stat: 0.6667, hits: 0.25, power: 0.25, resist: 2, skill: 5,
};

export interface ToAWeights {
  melee_speed: number; casting_speed: number;
  melee_damage: number; style_damage: number; spell_damage: number;
  resist_pierce: number;
  spell_duration: number;
  healing_bonus: number; buff_bonus: number; debuff_bonus: number;
  power_pool: number; af: number;
  archery_speed: number; fatigue: number;
}
export const DEFAULT_TOA: ToAWeights = {
  melee_speed: 8, casting_speed: 8,
  melee_damage: 7, style_damage: 7, spell_damage: 7,
  resist_pierce: 8,
  spell_duration: 2,
  healing_bonus: 2, buff_bonus: 2, debuff_bonus: 2,
  power_pool: 1.5, af: 0.25,
  archery_speed: 7, fatigue: 1,
};

export interface ChargeWeights {
  charge: number; use: number; proc: number; reactive: number;
}
export const DEFAULT_CHARGE: ChargeWeights = {
  charge: 15, use: 10, proc: 12, reactive: 12,
};

export interface WastePenaltyWeights {
  overcap_stat: number;
  overcap_resist: number;
  dead_stat: number;
  useless_skill: number;
}
export const DEFAULT_WASTE: WastePenaltyWeights = {
  overcap_stat: 0.5, overcap_resist: 1, dead_stat: 0.3, useless_skill: 1,
};

/** Risk table from spec: oc -> base fail %. Linear interpolation between rows. */
export interface RiskRow { oc: number; pct: number }
export const DEFAULT_RISK_TABLE: RiskRow[] = [
  { oc: 0.0, pct: 0 }, { oc: 0.5, pct: 1 }, { oc: 1.0, pct: 2 },
  { oc: 1.5, pct: 4 }, { oc: 2.0, pct: 7 }, { oc: 2.5, pct: 12 },
  { oc: 3.0, pct: 20 }, { oc: 3.5, pct: 32 }, { oc: 4.0, pct: 50 },
  { oc: 4.5, pct: 75 }, { oc: 5.0, pct: 99 },
];

export interface RiskModifiers {
  quality_100: number; quality_99: number;
  skill_max: number; skill_low: number;
}
export const DEFAULT_RISK_MODS: RiskModifiers = {
  quality_100: 1.0, quality_99: 1.15, skill_max: 1.0, skill_low: 1.5,
};

export interface FormulaConfig {
  utility: UtilityWeights;
  toa: ToAWeights;
  charge: ChargeWeights;
  waste: WastePenaltyWeights;
  risk_table: RiskRow[];
  risk_mods: RiskModifiers;
}

export const DEFAULT_FORMULAS: FormulaConfig = {
  utility: DEFAULT_UTILITY,
  toa: DEFAULT_TOA,
  charge: DEFAULT_CHARGE,
  waste: DEFAULT_WASTE,
  risk_table: DEFAULT_RISK_TABLE,
  risk_mods: DEFAULT_RISK_MODS,
};

/* ============================================================
 * Utility / GearScore
 * ============================================================ */

/** ToA effect IDs that map to ToA weights. Keys = caps.ts effect IDs. */
const TOA_MAP: Record<string, keyof ToAWeights> = {
  MELEE_SPEED_BONUS: "melee_speed",
  CASTING_SPEED_BONUS: "casting_speed",
  MELEE_DAMAGE_BONUS: "melee_damage",
  STYLE_DAMAGE_BONUS: "style_damage",
  SPELL_DAMAGE_BONUS: "spell_damage",
  RESIST_PIERCE: "resist_pierce",
  SPELL_DURATION: "spell_duration",
  HEAL_BONUS: "healing_bonus",
  BUFF_BONUS: "buff_bonus",
  DEBUFF_BONUS: "debuff_bonus",
  POWER_POOL_BONUS: "power_pool",
  AF_BONUS: "af",
  ARCHERY_SPEED_BONUS: "archery_speed",
  FATIGUE: "fatigue",
};

/**
 * DAoC Utility:
 *   Utility = stats×0.6667 + hits×0.25 + resists×2 + skills×5 + power×0.25
 * Only counts the *effective* contribution (clamped at the cap — anything past
 * the cap is "wasted" and counted by the waste penalty instead).
 */
export function calcUtility(agg: AggregateResult, w: UtilityWeights = DEFAULT_UTILITY): number {
  let total = 0;
  for (const s of agg.stats) {
    const eff = Math.min(s.current, s.effectiveCap);
    if (eff <= 0) continue;
    if (s.group === "stat") total += eff * w.stat;
    else if (s.group === "resist") total += eff * w.resist;
    else if (s.group === "vital") {
      if (s.key === "HITPOINTS") total += eff * w.hits;
      else if (s.key === "POWER") total += eff * w.power;
    }
  }
  for (const sk of agg.skills) total += sk.value * w.skill;
  return round2(total);
}

/**
 * ToA Score = Σ (toa_bonus_value × weight). Reads the totals from the
 * aggregate (stats[].current). Uses the bonus's effective value (capped).
 */
export function calcToAScore(agg: AggregateResult, w: ToAWeights = DEFAULT_TOA): number {
  let total = 0;
  for (const s of agg.stats) {
    const key = TOA_MAP[s.key];
    if (!key) continue;
    const eff = Math.min(s.current, s.effectiveCap);
    total += eff * w[key];
  }
  return round2(total);
}

/**
 * Charge / proc / use score. We don't yet parse procs from item.effects
 * — the data layer needs charge/proc fields first. For now this returns 0
 * unless the caller passes counts directly.
 */
export function calcChargeScore(
  counts: { charge?: number; use?: number; proc?: number; reactive?: number },
  w: ChargeWeights = DEFAULT_CHARGE,
): number {
  return round2(
    (counts.charge ?? 0) * w.charge +
    (counts.use ?? 0) * w.use +
    (counts.proc ?? 0) * w.proc +
    (counts.reactive ?? 0) * w.reactive,
  );
}

/**
 * Waste penalty:
 *  + overcap stat points × 0.5
 *  + overcap resist points × 1
 *  + "dead stats" (stat with 0 cap relevance for class — we approximate
 *    by treating any stat with effectiveCap===0 as dead)
 *  + skills > some sane ceiling (we cap at 11 — anything above is overflow)
 */
export function calcWastePenalty(
  agg: AggregateResult,
  deadStatKeys: string[] = [],
  w: WastePenaltyWeights = DEFAULT_WASTE,
): number {
  let penalty = 0;
  for (const s of agg.stats) {
    if (s.waste > 0) {
      if (s.group === "stat" || s.group === "vital") penalty += s.waste * w.overcap_stat;
      else if (s.group === "resist") penalty += s.waste * w.overcap_resist;
    }
    if (deadStatKeys.includes(s.key) && s.current > 0) {
      penalty += s.current * w.dead_stat;
    }
  }
  for (const sk of agg.skills) {
    if (sk.value > 11) penalty += (sk.value - 11) * w.useless_skill;
  }
  return round2(penalty);
}

/**
 * GearScore = Utility + ToAScore + ChargeScore − WastePenalty
 */
export interface GearScoreBreakdown {
  utility: number;
  toa: number;
  charge: number;
  waste: number;
  total: number;
}
export function calcGearScore(
  agg: AggregateResult,
  opts: {
    cfg?: FormulaConfig;
    chargeCounts?: { charge?: number; use?: number; proc?: number; reactive?: number };
    deadStatKeys?: string[];
  } = {},
): GearScoreBreakdown {
  const cfg = opts.cfg ?? DEFAULT_FORMULAS;
  const utility = calcUtility(agg, cfg.utility);
  const toa = calcToAScore(agg, cfg.toa);
  const charge = calcChargeScore(opts.chargeCounts ?? {}, cfg.charge);
  const waste = calcWastePenalty(agg, opts.deadStatKeys ?? [], cfg.waste);
  return {
    utility, toa, charge, waste,
    total: round2(utility + toa + charge - waste),
  };
}

/* ============================================================
 * Spellcraft imbue / overcharge / risk
 * ============================================================ */

/**
 * Total Imbue Used = highest gem cost + (sum of rest) / 2.
 * Spec example: 10 + ((8+8+5)/2) = 20.5
 */
export function calcImbueUsed(gemCosts: number[]): number {
  if (gemCosts.length === 0) return 0;
  const sorted = [...gemCosts].sort((a, b) => b - a);
  const highest = sorted[0];
  const rest = sorted.slice(1).reduce((s, n) => s + n, 0);
  return round2(highest + rest / 2);
}

export function calcOvercharge(imbueUsed: number, safeCapacity: number): number {
  return round2(Math.max(0, imbueUsed - safeCapacity));
}

/** Linear interpolation through the risk table for a given overcharge value. */
function lookupBaseRisk(oc: number, table: RiskRow[]): number {
  if (oc <= 0) return 0;
  if (oc >= table[table.length - 1].oc) return table[table.length - 1].pct;
  for (let i = 0; i < table.length - 1; i++) {
    const a = table[i]; const b = table[i + 1];
    if (oc >= a.oc && oc <= b.oc) {
      const t = (oc - a.oc) / (b.oc - a.oc || 1);
      return a.pct + (b.pct - a.pct) * t;
    }
  }
  return 0;
}

/**
 * Final Risk % = base × qualityModifier × skillModifier
 *   100% Quality = ×1.0, 99% = ×1.15
 *   Max skill = ×1.0, lower skill = increased multiplier
 * Returns a number in [0,100].
 */
export function calcFailRisk(
  overcharge: number,
  opts: {
    quality?: number;       // 100 or 99
    skillRatio?: number;    // 0..1, 1=max
    cfg?: FormulaConfig;
  } = {},
): number {
  const cfg = opts.cfg ?? DEFAULT_FORMULAS;
  const base = lookupBaseRisk(overcharge, cfg.risk_table);
  const qMod = (opts.quality ?? 100) >= 100 ? cfg.risk_mods.quality_100 : cfg.risk_mods.quality_99;
  const skillRatio = Math.max(0, Math.min(1, opts.skillRatio ?? 1));
  const sMod = cfg.risk_mods.skill_max + (1 - skillRatio) * (cfg.risk_mods.skill_low - cfg.risk_mods.skill_max);
  return Math.min(100, round2(base * qMod * sMod));
}

export type RiskLevel = "safe" | "moderate" | "risky" | "very_risky" | "extreme";
export function riskLevel(overcharge: number): RiskLevel {
  if (overcharge <= 1.0) return "safe";
  if (overcharge <= 2.5) return "moderate";
  if (overcharge <= 3.5) return "risky";
  if (overcharge <= 4.5) return "very_risky";
  return "extreme";
}
export function riskLabel(level: RiskLevel): string {
  return {
    safe: "Safe", moderate: "Moderate", risky: "Risky",
    very_risky: "Very Risky", extreme: "Extreme",
  }[level];
}

/* ============================================================
 * Resist Hole / Missing Stats helpers
 * ============================================================ */

export interface ResistHole {
  key: string; label: string; cap: number; current: number; missing: number;
}
export function detectResistHoles(agg: AggregateResult): ResistHole[] {
  const out: ResistHole[] = [];
  for (const s of agg.stats) {
    if (s.group !== "resist") continue;
    const missing = s.effectiveCap - s.current;
    if (missing > 0) {
      out.push({ key: s.key, label: s.label, cap: s.effectiveCap, current: s.current, missing });
    }
  }
  return out.sort((a, b) => b.missing - a.missing);
}

export interface MissingStat {
  key: string; label: string; target: number; current: number; missing: number;
}
export function detectMissingStats(agg: AggregateResult, targets: Partial<Record<string, number>>): MissingStat[] {
  const out: MissingStat[] = [];
  for (const [key, target] of Object.entries(targets)) {
    if (!target) continue;
    const s = agg.stats.find((x) => x.key === key);
    if (!s) continue;
    const missing = target - s.current;
    if (missing > 0) out.push({ key, label: s.label ?? key, target, current: s.current, missing });
  }
  return out.sort((a, b) => b.missing - a.missing);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/* ============================================================
 * Helper: read CAPS to know all stat keys (for /admin and dead-stat config)
 * ============================================================ */
export function allStatKeys(): { key: string; label: string; group: string }[] {
  return Object.entries(CAPS).map(([key, def]) => ({ key, label: def.label, group: def.group }));
}