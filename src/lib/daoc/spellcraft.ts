/**
 * DAoC Spellcraft engine.
 *
 * Rules:
 *  - Each spellcraftable item supports max 4 gems.
 *  - Each gem grants ONE bonus (stat / resist / hp / power).
 *  - Imbue cost uses HALF-POINTS (0.5, 1.5, 2.5, etc.) matching the live game.
 *  - Total imbue = Σ(all gem costs) + max(gem cost)  ← the highest gem counts twice.
 *  - Default safe imbue limit = 32 (Eden MP gear at level 51 q100).
 *  - Drops / artifacts are NOT craftable.
 */

import type { DBItem } from "./types";

export type GemCategory = "stat" | "resist" | "skill" | "cap" | "hp" | "power";

export interface GemDef {
  id: string;
  label: string;
  effectId: string;
  value: number;
  /** Imbue cost in half-points, e.g. 0.5, 1.5, 9.5 */
  cost: number;
  category: GemCategory;
  tier: number;
  gemName: string;
  quality: string;
  family: string;
}

const QUALITIES_10 = [
  "Raw",       // T1
  "Uncut",     // T2
  "Rough",     // T3
  "Flawed",    // T4
  "Imperfect", // T5
  "Polished",  // T6
  "Faceted",   // T7
  "Precious",  // T8
  "Flawless",  // T9
  "Perfect",   // T10
] as const;

// ─── Stats: +1/+4/+7/+10/+13/+16/+19/+22/+25/+28  cost: 0.5→9.5 ────────
const STAT_TABLE = [
  { tier: 1,  cost: 0.5, value: 1  },
  { tier: 2,  cost: 1.5, value: 4  },
  { tier: 3,  cost: 2.5, value: 7  },
  { tier: 4,  cost: 3.5, value: 10 },
  { tier: 5,  cost: 4.5, value: 13 },
  { tier: 6,  cost: 5.5, value: 16 },
  { tier: 7,  cost: 6.5, value: 19 },
  { tier: 8,  cost: 7.5, value: 22 },
  { tier: 9,  cost: 8.5, value: 25 },
  { tier: 10, cost: 9.5, value: 28 },
];

// ─── Resists: +1/+2/+3/+5/+7/+9/+11/+13/+15/+17%  cost: 0.5→16 ─────────
const RESIST_TABLE = [
  { tier: 1,  cost: 0.5, value: 1  },
  { tier: 2,  cost: 1,   value: 2  },
  { tier: 3,  cost: 2,   value: 3  },
  { tier: 4,  cost: 4,   value: 5  },
  { tier: 5,  cost: 6,   value: 7  },
  { tier: 6,  cost: 8,   value: 9  },
  { tier: 7,  cost: 10,  value: 11 },
  { tier: 8,  cost: 12,  value: 13 },
  { tier: 9,  cost: 14,  value: 15 },
  { tier: 10, cost: 16,  value: 17 },
];

// ─── Hit Points: +4/+12/+20/+28/+36/+44/+52/+60/+68/+76  cost: 0.5→9.5 ──
const HP_TABLE = [
  { tier: 1,  cost: 0.5, value: 4  },
  { tier: 2,  cost: 1.5, value: 12 },
  { tier: 3,  cost: 2.5, value: 20 },
  { tier: 4,  cost: 3.5, value: 28 },
  { tier: 5,  cost: 4.5, value: 36 },
  { tier: 6,  cost: 5.5, value: 44 },
  { tier: 7,  cost: 6.5, value: 52 },
  { tier: 8,  cost: 7.5, value: 60 },
  { tier: 9,  cost: 8.5, value: 68 },
  { tier: 10, cost: 9.5, value: 76 },
];

// ─── Power pool: +1/+2/+3/+5/+7/+9/+11/+13/+15/+17%  cost: 0.5→16 ───────
const POWER_TABLE = [
  { tier: 1,  cost: 0.5, value: 1  },
  { tier: 2,  cost: 1,   value: 2  },
  { tier: 3,  cost: 2,   value: 3  },
  { tier: 4,  cost: 4,   value: 5  },
  { tier: 5,  cost: 6,   value: 7  },
  { tier: 6,  cost: 8,   value: 9  },
  { tier: 7,  cost: 10,  value: 11 },
  { tier: 8,  cost: 12,  value: 13 },
  { tier: 9,  cost: 14,  value: 15 },
  { tier: 10, cost: 16,  value: 17 },
];

const STATS = [
  { id: "STRENGTH",     label: "Strength",     family: "Fiery Essence Jewel"   },
  { id: "CONSTITUTION", label: "Constitution", family: "Earthen Essence Jewel" },
  { id: "DEXTERITY",    label: "Dexterity",    family: "Vapor Essence Jewel"   },
  { id: "QUICKNESS",    label: "Quickness",    family: "Airy Essence Jewel"    },
  { id: "INTELLIGENCE", label: "Intelligence", family: "Dusty Essence Jewel"   },
  { id: "PIETY",        label: "Piety",        family: "Watery Essence Jewel"  },
  { id: "EMPATHY",      label: "Empathy",      family: "Heated Essence Jewel"  },
  { id: "CHARISMA",     label: "Charisma",     family: "Icy Essence Jewel"     },
  { id: "ACUITY",       label: "Acuity",       family: "Dusty Essence Jewel"   },
];

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
      const quality = QUALITIES_10[t.tier - 1];
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
      });
    }
  }

  for (const r of RESISTS) {
    for (const t of RESIST_TABLE) {
      const quality = QUALITIES_10[t.tier - 1];
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
      });
    }
  }

  for (const t of HP_TABLE) {
    const quality = QUALITIES_10[t.tier - 1];
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

  for (const t of POWER_TABLE) {
    const quality = QUALITIES_10[t.tier - 1];
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

/**
 * DAoC imbue formula: sum of all gem costs + the highest gem cost again.
 * The most expensive gem slot counts double — this is the classic overcharge rule.
 */
export function calcImbue(gems: GemDef[]): number {
  if (gems.length === 0) return 0;
  const sum = gems.reduce((acc, g) => acc + g.cost, 0);
  const highest = Math.max(...gems.map((g) => g.cost));
  return sum + highest;
}

export function inspectGems(
  gemIds: GemSet | undefined,
  imbueLimit = SAFE_IMBUE_LIMIT,
): ItemSpellcraftStatus {
  const gems = (gemIds ?? [])
    .map((id) => GEM_BY_ID[id])
    .filter(Boolean) as GemDef[];

  const imbueUsed = calcImbue(gems);

  return {
    used: gems.length,
    remaining: Math.max(0, MAX_GEMS_PER_ITEM - gems.length),
    imbueUsed,
    imbueLimit,
    overcharge: imbueUsed > imbueLimit,
    gems,
  };
}

export function gemsToEffects(
  gemIds: GemSet | undefined,
): { id: string; value: number }[] {
  const out = new Map<string, number>();
  for (const g of (gemIds ?? [])
    .map((id) => GEM_BY_ID[id])
    .filter(Boolean) as GemDef[]) {
    out.set(g.effectId, (out.get(g.effectId) ?? 0) + g.value);
  }
  return Array.from(out, ([id, value]) => ({ id, value }));
}
