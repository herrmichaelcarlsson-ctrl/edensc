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
  /** Canonical gem name, e.g. "Flawless Fiery Essence Jewel" */
  gemName: string;
  /** Quality word, e.g. "Flawless" */
  quality: string;
  /** Family name, e.g. "Fiery Essence Jewel" */
  family: string;
}

/**
 * Canonical Mythic gem qualities (1.87 era — used by Eden).
 * Tier index is 1-based here (we skip Raw/Uncut/Rough since modern DAoC
 * effectively starts at Flawed for usable templates).
 */
const QUALITIES = [
  "Flawed",      // T1
  "Imperfect",   // T2
  "Polished",    // T3
  "Faceted",     // T4
  "Precious",    // T5
  "Flawless",    // T6
  "Perfect",     // T7
] as const;

/**
 * Stats: Essence jewels. Eden values (matches in-game gem progression).
 */
const STAT_TABLE = [
  { tier: 1, cost: 1,  value: 3 },
  { tier: 2, cost: 2,  value: 5 },
  { tier: 3, cost: 4,  value: 7 },
  { tier: 4, cost: 6,  value: 9 },
  { tier: 5, cost: 9,  value: 11 },
  { tier: 6, cost: 13, value: 13 },
  { tier: 7, cost: 18, value: 15 },
];

/**
 * Resists: Shielding jewels.
 */
const RESIST_TABLE = [
  { tier: 1, cost: 1,  value: 1 },
  { tier: 2, cost: 2,  value: 2 },
  { tier: 3, cost: 4,  value: 3 },
  { tier: 4, cost: 6,  value: 5 },
  { tier: 5, cost: 9,  value: 7 },
  { tier: 6, cost: 13, value: 9 },
  { tier: 7, cost: 18, value: 11 },
];

/**
 * Canonical "Essence Jewel" family per stat (per Mythic spellcraft guide).
 */
const STATS = [
  { id: "STRENGTH",     label: "Strength",     family: "Fiery Essence Jewel" },
  { id: "CONSTITUTION", label: "Constitution", family: "Earthen Essence Jewel" },
  { id: "DEXTERITY",    label: "Dexterity",    family: "Vapor Essence Jewel" },
  { id: "QUICKNESS",    label: "Quickness",    family: "Airy Essence Jewel" },
  { id: "ACUITY",       label: "Acuity",       family: "Dusty Essence Jewel" },
  { id: "PIETY",        label: "Piety",        family: "Watery Essence Jewel" },
  { id: "EMPATHY",      label: "Empathy",      family: "Heated Essence Jewel" },
  { id: "CHARISMA",     label: "Charisma",     family: "Icy Essence Jewel" },
  { id: "INTELLIGENCE", label: "Intelligence", family: "Dusty Essence Jewel" },
];

/**
 * Canonical "Shielding Jewel" family per resist.
 */
const RESISTS = [
  { id: "RES_CRUSH",  label: "Crush",  family: "Fiery Shielding Jewel" },
  { id: "RES_SLASH",  label: "Slash",  family: "Watery Shielding Jewel" },
  { id: "RES_THRUST", label: "Thrust", family: "Airy Shielding Jewel" },
  { id: "RES_HEAT",   label: "Heat",   family: "Heated Shielding Jewel" },
  { id: "RES_COLD",   label: "Cold",   family: "Icy Shielding Jewel" },
  { id: "RES_MATTER", label: "Matter", family: "Earthen Shielding Jewel" },
  { id: "RES_BODY",   label: "Body",   family: "Dusty Shielding Jewel" },
  { id: "RES_SPIRIT", label: "Spirit", family: "Vapor Shielding Jewel" },
  { id: "RES_ENERGY", label: "Energy", family: "Light Shielding Jewel" },
];

function buildGems(): GemDef[] {
  const out: GemDef[] = [];
  for (const s of STATS) {
    for (const t of STAT_TABLE) {
      const quality = QUALITIES[t.tier - 1];
      out.push({
        id: `dust_${s.id.toLowerCase()}_t${t.tier}`,
        label: `+${t.value} ${s.label}`,
        effectId: s.id,
        value: t.value,
        cost: t.cost,
        category: "stat",
        tier: t.tier,
        family: s.family,
        quality,
        gemName: `${quality} ${s.family}`,
      });
    }
  }
  for (const r of RESISTS) {
    for (const t of RESIST_TABLE) {
      const quality = QUALITIES[t.tier - 1];
      out.push({
        id: `shard_${r.id.toLowerCase()}_t${t.tier}`,
        label: `+${t.value}% ${r.label}`,
        effectId: r.id,
        value: t.value,
        cost: t.cost,
        category: "resist",
        tier: t.tier,
        family: r.family,
        quality,
        gemName: `${quality} ${r.family}`,
      });
    }
  }
  // Stat caps cannot be spellcrafted — they only appear on items (drops/crafted bases).
  for (const t of [
    { tier: 1, cost: 1, value: 12 },
    { tier: 2, cost: 2, value: 20 },
    { tier: 3, cost: 3, value: 28 },
    { tier: 4, cost: 5, value: 36 },
    { tier: 5, cost: 8, value: 44 },
  ]) {
    const quality = QUALITIES[t.tier - 1];
    const family = "Blood Essence Jewel";
    out.push({
      id: `hp_t${t.tier}`,
      label: `+${t.value} Hit Points`,
      effectId: "HITPOINTS",
      value: t.value,
      cost: t.cost,
      category: "hp",
      tier: t.tier,
      family,
      quality,
      gemName: `${quality} ${family}`,
    });
  }
  for (const t of [
    { tier: 1, cost: 1, value: 1 },
    { tier: 2, cost: 2, value: 2 },
    { tier: 3, cost: 3, value: 3 },
    { tier: 4, cost: 5, value: 4 },
    { tier: 5, cost: 8, value: 5 },
  ]) {
    const quality = QUALITIES[t.tier - 1];
    const family = "Mystical Essence Jewel";
    out.push({
      id: `power_t${t.tier}`,
      label: `+${t.value}% Power`,
      effectId: "POWER_POOL",
      value: t.value,
      cost: t.cost,
      category: "power",
      tier: t.tier,
      family,
      quality,
      gemName: `${quality} ${family}`,
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
  if (o === "CUSTOM" || s === "CUSTOM") return false;
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
