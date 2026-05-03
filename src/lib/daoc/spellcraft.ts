/**
 * DAoC / Eden Spellcraft engine — canonical 1.124 era values.
 *
 * Sourced from the Eden imbue point reference table (Raw → Perfect, 10 tiers).
 *
 * Rules:
 *  - Each spellcraftable item supports max 4 gems.
 *  - Each gem grants ONE bonus (stat / resist / hp / power / skill).
 *  - Each gem costs imbue points; safe limit on MP gear = 32.
 *  - Stat caps are NOT spellcraftable (only on items themselves).
 *  - Drops / artifacts / ToA / ML items are NOT craftable.
 */

import type { DBItem } from "./types";

export type GemCategory = "stat" | "resist" | "hp" | "power" | "skill";
export type GemRealm = "Albion" | "Hibernia" | "Midgard";

export interface GemDef {
  id: string;
  /** Short label, e.g. "+25 Strength" */
  label: string;
  effectId: string;
  value: number;
  /** Imbue point cost (can be 0.5 / 1.5 / etc.) */
  cost: number;
  category: GemCategory;
  /** 1..10 */
  tier: number;
  /** Canonical gem name, e.g. "Flawless Fiery Essence Jewel" */
  gemName: string;
  /** Quality word, e.g. "Flawless" */
  quality: string;
  /** Family name, e.g. "Fiery Essence Jewel" */
  family: string;
  /** Rough vendor / craft price reference (copper) */
  price: number;
  /** For skill gems: which realm they belong to (Albion / Hibernia / Midgard). */
  realm?: GemRealm;
}

/** Canonical Eden / Mythic 10-tier quality progression. */
const QUALITIES = [
  "Raw",        // T1
  "Uncut",      // T2
  "Rough",      // T3
  "Flawed",     // T4
  "Imperfect",  // T5
  "Polished",   // T6
  "Faceted",    // T7
  "Precious",   // T8
  "Flawless",   // T9
  "Perfect",    // T10
] as const;

/* ============================================================
   Per-tier value/cost tables (verified against Eden reference)
   ============================================================ */

/** Stats: +1/4/7/10/13/16/19/22/25/28 — imbue 0.5/1.5/2.5/.../9.5 */
const STAT_TABLE = [
  { tier: 1,  value: 1,  cost: 0.5, price:    160 },
  { tier: 2,  value: 4,  cost: 1.5, price:    920 },
  { tier: 3,  value: 7,  cost: 2.5, price:   3900 },
  { tier: 4,  value: 10, cost: 3.5, price:  13900 },
  { tier: 5,  value: 13, cost: 4.5, price:  40100 },
  { tier: 6,  value: 16, cost: 5.5, price:  88980 },
  { tier: 7,  value: 19, cost: 6.5, price: 193000 },
  { tier: 8,  value: 22, cost: 7.5, price: 198920 },
  { tier: 9,  value: 25, cost: 8.5, price: 258240 },
  { tier: 10, value: 28, cost: 9.5, price: 296860 },
];

/** Resists: +1/2/3/5/7/9/11/13/15/17 % — imbue 0.5/1/2/4/6/8/10/12/14/16 */
const RESIST_TABLE = [
  { tier: 1,  value: 1,  cost: 0.5, price:    160 },
  { tier: 2,  value: 2,  cost: 1,   price:    980 },
  { tier: 3,  value: 3,  cost: 2,   price:   4020 },
  { tier: 4,  value: 5,  cost: 4,   price:  14080 },
  { tier: 5,  value: 7,  cost: 6,   price:  40340 },
  { tier: 6,  value: 9,  cost: 8,   price:  89280 },
  { tier: 7,  value: 11, cost: 10,  price: 133360 },
  { tier: 8,  value: 13, cost: 12,  price: 199340 },
  { tier: 9,  value: 15, cost: 14,  price: 258720 },
  { tier: 10, value: 17, cost: 16,  price: 297400 },
];

/** Hit points (Blood Essence Jewel): +4/12/20/.../76 — imbue same as stats. */
const HP_TABLE = [
  { tier: 1,  value: 4,  cost: 0.5, price:    160 },
  { tier: 2,  value: 12, cost: 1.5, price:    920 },
  { tier: 3,  value: 20, cost: 2.5, price:   3900 },
  { tier: 4,  value: 28, cost: 3.5, price:  13900 },
  { tier: 5,  value: 36, cost: 4.5, price:  40100 },
  { tier: 6,  value: 44, cost: 5.5, price:  88980 },
  { tier: 7,  value: 52, cost: 6.5, price: 133000 },
  { tier: 8,  value: 60, cost: 7.5, price: 198920 },
  { tier: 9,  value: 68, cost: 8.5, price: 258240 },
  { tier: 10, value: 76, cost: 9.5, price: 296860 },
];

/** Power (Mystic Essence Jewel): +1/2/3/5/7/9/11/13/15/17 — imbue 0.5/1/2/4/6/8/10/12/14/16 */
const POWER_TABLE = [
  { tier: 1,  value: 1,  cost: 0.5, price:    160 },
  { tier: 2,  value: 2,  cost: 1,   price:    980 },
  { tier: 3,  value: 3,  cost: 2,   price:   3900 },
  { tier: 4,  value: 5,  cost: 4,   price:  13900 },
  { tier: 5,  value: 7,  cost: 6,   price:  40100 },
  { tier: 6,  value: 9,  cost: 8,   price:  88980 },
  { tier: 7,  value: 11, cost: 10,  price: 133000 },
  { tier: 8,  value: 13, cost: 12,  price: 198920 },
  { tier: 9,  value: 15, cost: 14,  price: 258240 },
  { tier: 10, value: 17, cost: 16,  price: 296860 },
];

/* ============================================================
   Stats — Essence Jewel families (canonical Eden names)
   ============================================================ */
const STATS = [
  { id: "STRENGTH",     label: "Strength",     family: "Fiery Essence Jewel"   },
  { id: "CONSTITUTION", label: "Constitution", family: "Earthen Essence Jewel" },
  { id: "DEXTERITY",    label: "Dexterity",    family: "Vapor Essence Jewel"   },
  { id: "QUICKNESS",    label: "Quickness",    family: "Airy Essence Jewel"    },
  { id: "INTELLIGENCE", label: "Intelligence", family: "Dusty Essence Jewel"   },
  { id: "PIETY",        label: "Piety",        family: "Watery Essence Jewel"  },
  { id: "EMPATHY",      label: "Empathy",      family: "Heated Essence Jewel"  },
  { id: "CHARISMA",     label: "Charisma",     family: "Icy Essence Jewel"     },
  // Acuity = display alias; uses Dusty/Watery/Heated/Icy depending on class.
  // Kept as separate selector so cross-realm templates still resolve.
  { id: "ACUITY",       label: "Acuity",       family: "Dusty Essence Jewel"   },
];

/* ============================================================
   Resists — Shielding Jewel families (canonical Eden names)
   ============================================================ */
const RESISTS = [
  { id: "RES_CRUSH",  label: "Crush",  family: "Fiery Shielding Jewel"   },
  { id: "RES_SLASH",  label: "Slash",  family: "Watery Shielding Jewel"  },
  { id: "RES_THRUST", label: "Thrust", family: "Airy Shielding Jewel"    },
  { id: "RES_HEAT",   label: "Heat",   family: "Heated Shielding Jewel"  },
  { id: "RES_COLD",   label: "Cold",   family: "Icy Shielding Jewel"     },
  { id: "RES_MATTER", label: "Matter", family: "Earthen Shielding Jewel" },
  { id: "RES_BODY",   label: "Body",   family: "Dusty Shielding Jewel"   },
  { id: "RES_SPIRIT", label: "Spirit", family: "Vapor Shielding Jewel"   },
  { id: "RES_ENERGY", label: "Energy", family: "Light Shielding Jewel"   },
];

function buildGems(): GemDef[] {
  const out: GemDef[] = [];

  for (const s of STATS) {
    for (const t of STAT_TABLE) {
      const quality = QUALITIES[t.tier - 1];
      out.push({
        id: `stat_${s.id.toLowerCase()}_t${t.tier}`,
        label: `+${t.value} ${s.label}`,
        effectId: s.id,
        value: t.value,
        cost: t.cost,
        category: "stat",
        tier: t.tier,
        family: s.family,
        quality,
        gemName: `${quality} ${s.family}`,
        price: t.price,
      });
    }
  }

  for (const r of RESISTS) {
    for (const t of RESIST_TABLE) {
      const quality = QUALITIES[t.tier - 1];
      out.push({
        id: `resist_${r.id.toLowerCase()}_t${t.tier}`,
        label: `+${t.value}% ${r.label}`,
        effectId: r.id,
        value: t.value,
        cost: t.cost,
        category: "resist",
        tier: t.tier,
        family: r.family,
        quality,
        gemName: `${quality} ${r.family}`,
        price: t.price,
      });
    }
  }

  for (const t of HP_TABLE) {
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
      price: t.price,
    });
  }

  for (const t of POWER_TABLE) {
    const quality = QUALITIES[t.tier - 1];
    const family = "Mystic Essence Jewel";
    out.push({
      id: `power_t${t.tier}`,
      label: `+${t.value} Power`,
      effectId: "POWER_POOL",
      value: t.value,
      cost: t.cost,
      category: "power",
      tier: t.tier,
      family,
      quality,
      gemName: `${quality} ${family}`,
      price: t.price,
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
