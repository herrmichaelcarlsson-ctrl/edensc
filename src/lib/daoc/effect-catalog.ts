/**
 * Shared bonus catalogue used by Custom Item dialog & Submit Item form.
 * Grouped so the UI can render: [Category] [Stat] [Value] rows.
 */

export interface EffectOption {
  id: string;
  label: string;
  group: EffectGroup;
  /** "%" for resists / ToA % bonuses */
  suffix?: string;
}

export type EffectGroup =
  | "Stats"
  | "Stat Caps (ToA)"
  | "Vital"
  | "Resists"
  | "Skills"
  | "ToA Bonuses";

export const EFFECT_OPTIONS: EffectOption[] = [
  // Stats
  { id: "STRENGTH", label: "Strength", group: "Stats" },
  { id: "CONSTITUTION", label: "Constitution", group: "Stats" },
  { id: "DEXTERITY", label: "Dexterity", group: "Stats" },
  { id: "QUICKNESS", label: "Quickness", group: "Stats" },
  { id: "ACUITY", label: "Acuity", group: "Stats" },
  { id: "PIETY", label: "Piety", group: "Stats" },
  { id: "EMPATHY", label: "Empathy", group: "Stats" },
  { id: "CHARISMA", label: "Charisma", group: "Stats" },
  { id: "INTELLIGENCE", label: "Intelligence", group: "Stats" },
  // Stat caps
  { id: "CAP_STRENGTH", label: "Strength Cap", group: "Stat Caps (ToA)" },
  { id: "CAP_CONSTITUTION", label: "Constitution Cap", group: "Stat Caps (ToA)" },
  { id: "CAP_DEXTERITY", label: "Dexterity Cap", group: "Stat Caps (ToA)" },
  { id: "CAP_QUICKNESS", label: "Quickness Cap", group: "Stat Caps (ToA)" },
  { id: "CAP_ACUITY", label: "Acuity Cap", group: "Stat Caps (ToA)" },
  { id: "CAP_PIETY", label: "Piety Cap", group: "Stat Caps (ToA)" },
  { id: "CAP_EMPATHY", label: "Empathy Cap", group: "Stat Caps (ToA)" },
  { id: "CAP_CHARISMA", label: "Charisma Cap", group: "Stat Caps (ToA)" },
  { id: "CAP_HITPOINTS", label: "HP Cap", group: "Stat Caps (ToA)" },
  // Vital
  { id: "HITPOINTS", label: "Hit Points", group: "Vital" },
  { id: "POWER_POOL", label: "Power %", group: "Vital", suffix: "%" },
  { id: "FATIGUE", label: "Fatigue", group: "Vital" },
  // Resists
  { id: "RES_CRUSH", label: "Crush", group: "Resists", suffix: "%" },
  { id: "RES_SLASH", label: "Slash", group: "Resists", suffix: "%" },
  { id: "RES_THRUST", label: "Thrust", group: "Resists", suffix: "%" },
  { id: "RES_HEAT", label: "Heat", group: "Resists", suffix: "%" },
  { id: "RES_COLD", label: "Cold", group: "Resists", suffix: "%" },
  { id: "RES_MATTER", label: "Matter", group: "Resists", suffix: "%" },
  { id: "RES_BODY", label: "Body", group: "Resists", suffix: "%" },
  { id: "RES_SPIRIT", label: "Spirit", group: "Resists", suffix: "%" },
  { id: "RES_ENERGY", label: "Energy", group: "Resists", suffix: "%" },
  // ToA bonuses
  { id: "MELEE_DAMAGE", label: "Melee Damage", group: "ToA Bonuses", suffix: "%" },
  { id: "MAGIC_DAMAGE", label: "Magic Damage", group: "ToA Bonuses", suffix: "%" },
  { id: "STYLE_DAMAGE", label: "Style Damage", group: "ToA Bonuses", suffix: "%" },
  { id: "ARCHERY_DMG", label: "Archery Damage", group: "ToA Bonuses", suffix: "%" },
  { id: "MELEE_SPEED", label: "Melee Speed", group: "ToA Bonuses", suffix: "%" },
  { id: "ARCHERY_SPEED", label: "Archery Speed", group: "ToA Bonuses", suffix: "%" },
  { id: "CAST_SPEED", label: "Casting Speed", group: "ToA Bonuses", suffix: "%" },
  { id: "SPELL_RANGE", label: "Spell Range", group: "ToA Bonuses", suffix: "%" },
  { id: "SPELL_DURATION", label: "Spell Duration", group: "ToA Bonuses", suffix: "%" },
  { id: "BUFF_BONUS", label: "Buff Effectiveness", group: "ToA Bonuses", suffix: "%" },
  { id: "DEBUFF_BONUS", label: "Debuff Effectiveness", group: "ToA Bonuses", suffix: "%" },
  { id: "HEAL_BONUS", label: "Healing Effect", group: "ToA Bonuses", suffix: "%" },
  { id: "POWER_POOL_FLAT", label: "Power Pool", group: "ToA Bonuses" },
];

export const EFFECT_GROUPS: EffectGroup[] = [
  "Stats", "Skills", "Resists", "Vital", "Stat Caps (ToA)", "ToA Bonuses",
];

export function effectById(id: string): EffectOption | undefined {
  return EFFECT_OPTIONS.find((e) => e.id === id);
}
