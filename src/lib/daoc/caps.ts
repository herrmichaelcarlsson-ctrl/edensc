/**
 * DAoC Eden cap rules.
 * Configurable in one place so the engine stays data-driven.
 */

export type CapKind = "stat" | "resist" | "bonusPct" | "bonusFlat" | "skill" | "hp" | "power";

export interface CapDef {
  /** Pretty label */
  label: string;
  /** Effect IDs in the XML that contribute to this stat */
  effectIds: string[];
  /** Cap from items only */
  itemCap: number;
  /** Hard cap (incl. cap bonuses, mythicals) */
  hardCap?: number;
  /** "Cap bonus" effect IDs that raise the hardCap (each point = +1 to cap) */
  capBonusEffectIds?: string[];
  /** Max amount the cap can be raised */
  maxCapBonus?: number;
  kind: CapKind;
  group: "stat" | "resist" | "bonus" | "skill" | "vital";
}

/* ---------- STATS ---------- */
const stat = (label: string, id: string, capId?: string): CapDef => ({
  label,
  effectIds: [id],
  // Base item cap is 75. +X Cap items raise it up to +26 (hard cap 101).
  itemCap: 75,
  hardCap: 75 + 26,
  capBonusEffectIds: capId ? [capId] : [],
  maxCapBonus: 26,
  kind: "stat",
  group: "stat",
});

/* ---------- RESISTS ---------- */
const resist = (label: string, id: string, capId?: string): CapDef => ({
  label,
  effectIds: [id],
  itemCap: 26,
  hardCap: 26 + 5,
  capBonusEffectIds: capId ? [capId] : [],
  maxCapBonus: 5,
  kind: "resist",
  group: "resist",
});

/* ---------- BONUS % CAPS ---------- */
const bonusPct = (label: string, id: string, cap: number): CapDef => ({
  label,
  effectIds: [id],
  itemCap: cap,
  hardCap: cap,
  kind: "bonusPct",
  group: "bonus",
});

export const CAPS: Record<string, CapDef> = {
  // Primary stats
  STRENGTH: stat("Strength", "STRENGTH", "CAP_STRENGTH"),
  CONSTITUTION: stat("Constitution", "CONSTITUTION", "CAP_CONSTITUTION"),
  DEXTERITY: stat("Dexterity", "DEXTERITY", "CAP_DEXTERITY"),
  QUICKNESS: stat("Quickness", "QUICKNESS", "CAP_QUICKNESS"),
  ACUITY: stat("Acuity", "ACUITY", "CAP_ACUITY"),
  PIETY: stat("Piety", "PIETY", "CAP_PIETY"),
  EMPATHY: stat("Empathy", "EMPATHY", "CAP_EMPATHY"),
  CHARISMA: stat("Charisma", "CHARISMA", "CAP_CHARISMA"),
  INTELLIGENCE: stat("Intelligence", "INTELLIGENCE", "CAP_INTELLIGENCE"),

  // Vital
  HITPOINTS: {
    label: "Hit Points",
    effectIds: ["HITPOINTS"],
    itemCap: 400,
    hardCap: 600,
    capBonusEffectIds: ["CAP_HITPOINTS"],
    maxCapBonus: 200,
    kind: "hp",
    group: "vital",
  },
  POWER: {
    label: "Power %",
    effectIds: ["POWER_POOL", "POWER"],
    itemCap: 26,
    hardCap: 51,
    capBonusEffectIds: ["CAP_POWER"],
    maxCapBonus: 25,
    kind: "power",
    group: "vital",
  },
  FATIGUE: {
    label: "Fatigue",
    effectIds: ["FATIGUE"],
    itemCap: 25,
    hardCap: 25,
    kind: "stat",
    group: "vital",
  },

  // Resists
  RES_CRUSH: resist("Crush", "RES_CRUSH"),
  RES_SLASH: resist("Slash", "RES_SLASH"),
  RES_THRUST: resist("Thrust", "RES_THRUST"),
  RES_HEAT: resist("Heat", "RES_HEAT"),
  RES_COLD: resist("Cold", "RES_COLD"),
  RES_MATTER: resist("Matter", "RES_MATTER"),
  RES_BODY: resist("Body", "RES_BODY"),
  RES_SPIRIT: resist("Spirit", "RES_SPIRIT"),
  RES_ENERGY: resist("Energy", "RES_ENERGY"),

  // Bonuses (capped %)
  CASTING_SPEED_BONUS: bonusPct("Casting Speed", "CASTING_SPEED_BONUS", 10),
  SPELL_DAMAGE_BONUS: bonusPct("Spell Damage", "SPELL_DAMAGE_BONUS", 10),
  MELEE_SPEED_BONUS: bonusPct("Melee Speed", "MELEE_SPEED_BONUS", 10),
  MELEE_DAMAGE_BONUS: bonusPct("Melee Damage", "MELEE_DAMAGE_BONUS", 10),
  STYLE_DAMAGE_BONUS: bonusPct("Style Damage", "STYLE_DAMAGE_BONUS", 10),
  RESIST_PIERCE: bonusPct("Resist Pierce", "RESIST_PIERCE", 10),
  SPELL_RANGE_BONUS: bonusPct("Spell Range", "SPELL_RANGE_BONUS", 10),
  HEAL_BONUS: bonusPct("Healing Effect", "HEAL_BONUS", 25),
  BUFF_BONUS: bonusPct("Buff Bonus", "BUFF_BONUS", 25),
  DEBUFF_BONUS: bonusPct("Debuff Bonus", "DEBUFF_BONUS", 25),
  SPELL_DURATION: bonusPct("Spell Duration", "SPELL_DURATION", 25),
  POWER_POOL_BONUS: bonusPct("Power Pool", "POWER_POOL_BONUS", 25),
  AF_BONUS: {
    label: "Armor Factor",
    effectIds: ["AF_BONUS"],
    itemCap: 50,
    hardCap: 50,
    kind: "bonusFlat",
    group: "bonus",
  },
  ALL_MAGIC_BONUS: bonusPct("All Magic Skills", "ALL_MAGIC_BONUS", 11),
  ALL_MELEE_BONUS: bonusPct("All Melee Skills", "ALL_MELEE_BONUS", 11),
  ALL_DUAL_BONUS: bonusPct("All Dual Skills", "ALL_DUAL_BONUS", 11),
};

/** All effect IDs we know about — anything else is treated as a generic skill. */
export const KNOWN_EFFECT_IDS = new Set<string>(
  Object.values(CAPS).flatMap((c) => [...c.effectIds, ...(c.capBonusEffectIds ?? [])]),
);