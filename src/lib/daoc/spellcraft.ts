/**
 * DAoC Spellcraft engine.
 *
 * Rules:
 *  - Each spellcraftable item supports max 4 gems.
 *  - Each gem grants ONE bonus (stat / resist / skill / cap / hp / power).
 *  - Each gem costs "imbue points" depending on its tier.
 *  - Default safe imbue limit = 32 (Eden MP gear).
 *  - Drops / artifacts are NOT craftable.
 */

import type { DBItem } from "./types";

export type GemCategory = "stat" | "resist" | "skill" | "cap" | "hp" | "power";

export interface GemDef {
  id: string;
  label: string;
  effectId: string;
  value: number;
  cost: number;
  category: GemCategory;
  tier: number;
}

const STAT_TABLE = [
  { tier: 1, cost: 1, value: 3 },
  { tier: 2, cost: 2, value: 4 },
  { tier: 3, cost: 3, value: 7 },
  { tier: 4, cost: 5, value: 10 },
  { tier: 5, cost: 8, value: 13 },
  { tier: 6, cost: 11, value: 16 },
  { tier: 7, cost: 14, value: 19 },
  { tier: 8, cost: 18, value: 22 },
  { tier: 9, cost: 22, value: 25 },
];

const RESIST_TABLE = [
  { tier: 1, cost: 1, value: 1 },
  { tier: 2, cost: 2, value: 2 },
  { tier: 3, cost: 3, value: 3 },
  { tier: 4, cost: 5, value: 4 },
  { tier: 5, cost: 8, value: 5 },
  { tier: 6, cost: 11, value: 6 },
  { tier: 7, cost: 14, value: 7 },
  { tier: 8, cost: 18, value: 8 },
  { tier: 9, cost: 22, value: 9 },
];

const CAP_TABLE = [
  { tier: 1, cost: 1, value: 1 },
  { tier: 2, cost: 2, value: 2 },
  { tier: 3, cost: 3, value: 3 },
  { tier: 4, cost: 5, value: 4 },
  { tier: 5, cost: 7, value: 5 },
];

const STATS = [
  { id: "STRENGTH", label: "Strength" },
  { id: "CONSTITUTION", label: "Constitution" },
  { id: "DEXTERITY", label: "Dexterity" },
  { id: "QUICKNESS", label: "Quickness" },
  { id: "ACUITY", label: "Acuity" },
  { id: "PIETY", label: "Piety" },
  { id: "EMPATHY", label: "Empathy" },
  { id: "CHARISMA", label: "Charisma" },
  { id: "INTELLIGENCE", label: "Intelligence" },
];

const RESISTS = [
  { id: "RES_CRUSH", label: "Crush" },
  { id: "RES_SLASH", label: "Slash" },
  { id: "RES_THRUST", label: "Thrust" },
  { id: "RES_HEAT", label: "Heat" },
  { id: "RES_COLD", label: "Cold" },
  { id: "RES_MATTER", label: "Matter" },
  { id: "RES_BODY", label: "Body" },
  { id: "RES_SPIRIT", label: "Spirit" },
  { id: "RES_ENERGY", label: "Energy" },
];

function buildGems(): GemDef[] {
  const out: GemDef[] = [];
  for (const s of STATS) {
    for (const t of STAT_TABLE) {
      out.push({
        id: `dust_${s.id.toLowerCase()}_t${t.tier}`,
        label: `+${t.value} ${s.label}`,
        effectId: s.id,
        value: t.value,
        cost: t.cost,
        category: "stat",
        tier: t.tier,
      });
    }
  }
  for (const r of RESISTS) {
    for (const t of RESIST_TABLE) {
      out.push({
        id: `shard_${r.id.toLowerCase()}_t${t.tier}`,
        label: `+${t.value}% ${r.label}`,
        effectId: r.id,
        value: t.value,
        cost: t.cost,
        category: "resist",
        tier: t.tier,
      });
    }
  }
  for (const s of STATS) {
    for (const t of CAP_TABLE) {
      out.push({
        id: `cap_${s.id.toLowerCase()}_t${t.tier}`,
        label: `+${t.value} ${s.label} Cap`,
        effectId: `CAP_${s.id}`,
        value: t.value,
        cost: t.cost,
        category: "cap",
        tier: t.tier,
      });
    }
  }
  for (const t of [
    { tier: 1, cost: 1, value: 12 },
    { tier: 2, cost: 2, value: 20 },
    { tier: 3, cost: 3, value: 28 },
    { tier: 4, cost: 5, value: 36 },
    { tier: 5, cost: 8, value: 44 },
  ]) {
    out.push({
      id: `hp_t${t.tier}`,
      label: `+${t.value} Hit Points`,
      effectId: "HITPOINTS",
      value: t.value,
      cost: t.cost,
      category: "hp",
      tier: t.tier,
    });
  }
  for (const t of [
    { tier: 1, cost: 1, value: 1 },
    { tier: 2, cost: 2, value: 2 },
    { tier: 3, cost: 3, value: 3 },
    { tier: 4, cost: 5, value: 4 },
    { tier: 5, cost: 8, value: 5 },
  ]) {
    out.push({
      id: `power_t${t.tier}`,
      label: `+${t.value}% Power`,
      effectId: "POWER_POOL",
      value: t.value,
      cost: t.cost,
      category: "power",
      tier: t.tier,
    });
  }
  return out;
}

export const GEMS: GemDef[] = buildGems();
export const GEM_BY_ID: Record<string, GemDef> = Object.fromEntries(
  GEMS.map((g) => [g.id, g]),
);

export type GemSet = string[];
export type SpellcraftMap = Partial<Record<string, GemSet>>;

export const MAX_GEMS_PER_ITEM = 4;
export const SAFE_IMBUE_LIMIT = 32;

export function isCraftable(item: DBItem | undefined): boolean {
  if (!item) return false;
  const o = (item.origin ?? "").toUpperCase();
  const s = (item.source_type ?? "").toUpperCase();
  if (o.includes("DROP") || o.includes("ARTIFACT") || o.includes("ML") || o.includes("TOA")) return false;
  if (s.includes("DROP") || s.includes("ARTIFACT")) return false;
  return true;
}

export interface ItemSpellcraftStatus {
  used: number;
  remaining: number;
  imbueUsed: number;
  imbueLimit: number;
  overcharge: boolean;
  gems: GemDef[];
}

export function inspectGems(gemIds: GemSet | undefined, imbueLimit = SAFE_IMBUE_LIMIT): ItemSpellcraftStatus {
  const gems = (gemIds ?? []).map((id) => GEM_BY_ID[id]).filter(Boolean) as GemDef[];
  const imbueUsed = gems.reduce((s, g) => s + g.cost, 0);
  return {
    used: gems.length,
    remaining: Math.max(0, MAX_GEMS_PER_ITEM - gems.length),
    imbueUsed,
    imbueLimit,
    overcharge: imbueUsed > imbueLimit,
    gems,
  };
}

export function gemsToEffects(gemIds: GemSet | undefined): { id: string; value: number }[] {
  const out = new Map<string, number>();
  for (const g of (gemIds ?? []).map((id) => GEM_BY_ID[id]).filter(Boolean) as GemDef[]) {
    out.set(g.effectId, (out.get(g.effectId) ?? 0) + g.value);
  }
  return Array.from(out, ([id, value]) => ({ id, value }));
}
