import type { DBItem, ItemEffect, SlotKey, TemplateSlots } from "./types";
import { CAPS, KNOWN_EFFECT_IDS, type CapDef } from "./caps";
import { gemsToEffects, type SpellcraftMap } from "./spellcraft";
import type { RaceDef } from "./races";

export type StatStatus = "missing" | "near" | "capped" | "waste" | "neutral";

export interface AggregatedStat {
  key: string;
  label: string;
  group: CapDef["group"];
  current: number;
  itemCap: number;
  hardCap: number;
  capBonus: number;
  effectiveCap: number;
  /** waste = max(0, current - effectiveCap) */
  waste: number;
  status: StatStatus;
}

export interface AggregateResult {
  stats: AggregatedStat[];
  /** Skill bonuses not part of CAPS (e.g. specific weapon skill +X) */
  skills: { id: string; value: number }[];
  /** Unknown / unclassified effects */
  other: { id: string; value: number }[];
  /** Score 0..100 */
  score: number;
}

function statusFor(current: number, effectiveCap: number, kind: CapDef["kind"]): StatStatus {
  if (current <= 0) return kind === "stat" || kind === "hp" || kind === "power" ? "missing" : "neutral";
  if (current > effectiveCap) return "waste";
  if (current === effectiveCap) return "capped";
  if (current >= effectiveCap * 0.85) return "near";
  return "missing";
}

export function aggregate(
  itemsBySlot: Partial<Record<SlotKey, DBItem | undefined>>,
  spellcraft: SpellcraftMap = {},
  race?: RaceDef | null,
): AggregateResult {
  const totals = new Map<string, number>();

  for (const slot of Object.keys(itemsBySlot) as SlotKey[]) {
    const item = itemsBySlot[slot];
    if (!item) continue;
    for (const eff of item.effects ?? []) {
      totals.set(eff.id, (totals.get(eff.id) ?? 0) + (eff.value ?? 0));
    }
    for (const eff of gemsToEffects(spellcraft[slot])) {
      totals.set(eff.id, (totals.get(eff.id) ?? 0) + eff.value);
    }
  }

  // Race innate resists (added on top of item totals).
  if (race?.innateResists) {
    for (const [id, value] of Object.entries(race.innateResists)) {
      if (value == null) continue;
      totals.set(id, (totals.get(id) ?? 0) + value);
    }
  }

  const stats: AggregatedStat[] = [];

  for (const [key, def] of Object.entries(CAPS)) {
    let current = 0;
    for (const id of def.effectIds) current += totals.get(id) ?? 0;

    let capBonus = 0;
    for (const id of def.capBonusEffectIds ?? []) capBonus += totals.get(id) ?? 0;
    if (def.maxCapBonus != null) capBonus = Math.min(capBonus, def.maxCapBonus);

    const effectiveCap = def.itemCap + capBonus;
    const waste = Math.max(0, current - effectiveCap);

    stats.push({
      key,
      label: def.label,
      group: def.group,
      current,
      itemCap: def.itemCap,
      hardCap: def.hardCap ?? def.itemCap,
      capBonus,
      effectiveCap,
      waste,
      status: statusFor(current, effectiveCap, def.kind),
    });
  }

  const skills: { id: string; value: number }[] = [];
  const other: { id: string; value: number }[] = [];
  for (const [id, value] of totals) {
    if (KNOWN_EFFECT_IDS.has(id)) continue;
    if (id.startsWith("CAP_") || id.startsWith("MCAP_")) continue;
    // Classify any remaining as skill-ish
    if (/^[A-Z_]+$/.test(id) && value <= 25) skills.push({ id, value });
    else other.push({ id, value });
  }

  // Score: capped resists + capped main bonuses, minus waste.
  let score = 0;
  let possible = 0;
  for (const s of stats) {
    if (s.group === "resist" || s.group === "bonus" || s.group === "stat") {
      possible += 2;
      if (s.status === "capped") score += 2;
      else if (s.status === "near") score += 1;
      else if (s.status === "waste") score -= 1;
    }
  }
  const finalScore = possible > 0 ? Math.max(0, Math.round((score / possible) * 100)) : 0;

  return { stats, skills, other, score: finalScore };
}

export function statusColor(status: StatStatus): string {
  switch (status) {
    case "capped": return "text-status-capped";
    case "near": return "text-status-near";
    case "missing": return "text-status-missing";
    case "waste": return "text-status-waste";
    default: return "text-muted-foreground";
  }
}

/** Compute a list of {effectId, total} contributed by ALL items (used for export/debug). */
export function flatTotals(itemsBySlot: Partial<Record<SlotKey, DBItem | undefined>>): ItemEffect[] {
  const totals = new Map<string, number>();
  for (const slot of Object.keys(itemsBySlot) as SlotKey[]) {
    const item = itemsBySlot[slot];
    if (!item) continue;
    for (const eff of item.effects ?? []) {
      totals.set(eff.id, (totals.get(eff.id) ?? 0) + eff.value);
    }
  }
  return Array.from(totals, ([id, value]) => ({ id, value }));
}