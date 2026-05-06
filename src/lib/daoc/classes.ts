import type { Realm } from "./types";

export const CLASSES: Record<Realm, string[]> = {
  Albion: [
    "Armsman", "Cabalist", "Cleric", "Friar", "Heretic", "Infiltrator",
    "Mercenary", "Minstrel", "Necromancer", "Occultist", "Paladin", "Reaver",
    "Scout", "Sorcerer", "Theurgist", "Wizard",
  ],
  Hibernia: [
    "Animist", "Bainshee", "Bard", "Blademaster", "Champion", "Druid",
    "Eldritch", "Enchanter", "Hero", "Mentalist", "Nightshade",
    "Ranger", "Valewalker", "Vampiir", "Warden",
  ],
  Midgard: [
    "Berserker", "Bonedancer", "Healer", "Hunter", "Runemaster",
    "Savage", "Shadowblade", "Shaman", "Skald", "Spiritmaster", "Thane",
    "Valkyrie", "Warlock", "Warrior",
  ],
};

/** Items have class_restriction either null or a single class name (uppercased). */
export function itemAllowedForClass(itemRestriction: string | null, className: string | null): boolean {
  if (!itemRestriction) return true;
  if (!className) return true;
  return itemRestriction.toUpperCase() === className.toUpperCase();
}

/**
 * Allowed armor types per class (DB armor_type values are UPPERCASE).
 * Cloth (MAGICAL/CLOTH) wearers can equip cloth only.
 * Heavier classes can usually wear lighter armor too in DAoC, but for
 * templating we restrict to the class's *primary* type to avoid clutter.
 */
export const CLASS_ARMOR: Record<string, string[]> = {
  // Albion
  Armsman: ["PLATE", "CHAIN", "STUDDED", "LEATHER", "CLOTH"],
  Paladin: ["PLATE", "CHAIN", "STUDDED", "LEATHER", "CLOTH"],
  Mercenary: ["CHAIN", "STUDDED", "LEATHER", "CLOTH"],
  Reaver: ["CHAIN", "STUDDED", "LEATHER", "CLOTH"],
  Cleric: ["CHAIN", "STUDDED", "LEATHER", "CLOTH"],
  Friar: ["LEATHER", "CLOTH"],
  Minstrel: ["STUDDED", "LEATHER", "CLOTH"],
  Scout: ["STUDDED", "LEATHER", "CLOTH"],
  Infiltrator: ["LEATHER", "CLOTH"],
  Heretic: ["LEATHER", "CLOTH", "CHAIN"],
  Wizard: ["CLOTH"],
  Sorcerer: ["CLOTH"],
  Theurgist: ["CLOTH"],
  Cabalist: ["CLOTH"],
  Necromancer: ["CLOTH"],
  Occultist: ["CLOTH"],

  // Hibernia
  Hero: ["SCALE", "REINFORCED", "LEATHER", "CLOTH"],
  Champion: ["SCALE", "REINFORCED", "LEATHER", "CLOTH"],
  Warden: ["SCALE", "REINFORCED", "LEATHER", "CLOTH"],
  Druid: ["SCALE", "REINFORCED", "LEATHER", "CLOTH"],
  Bard: ["SCALE", "REINFORCED", "LEATHER", "CLOTH"],
  Blademaster: ["REINFORCED", "LEATHER", "CLOTH"],
  Ranger: ["REINFORCED", "LEATHER", "CLOTH"],
  Valewalker: ["REINFORCED", "LEATHER", "CLOTH"],
  Vampiir: ["LEATHER", "CLOTH"],
  Nightshade: ["LEATHER", "CLOTH"],
  Animist: ["CLOTH"],
  Bainshee: ["CLOTH"],
  Eldritch: ["CLOTH"],
  Enchanter: ["CLOTH"],
  Mentalist: ["CLOTH"],

  // Midgard
  Warrior: ["CHAIN", "STUDDED", "LEATHER", "CLOTH"],
  Thane: ["CHAIN", "STUDDED", "LEATHER", "CLOTH"],
  Skald: ["CHAIN", "STUDDED", "LEATHER", "CLOTH"],
  Valkyrie: ["CHAIN", "STUDDED", "LEATHER", "CLOTH"],
  Berserker: ["STUDDED", "LEATHER", "CLOTH"],
  Savage: ["STUDDED", "LEATHER", "CLOTH"],
  Hunter: ["STUDDED", "LEATHER", "CLOTH"],
  Healer: ["CHAIN", "STUDDED", "LEATHER", "CLOTH"],
  Shaman: ["CHAIN", "STUDDED", "LEATHER", "CLOTH"],
  Shadowblade: ["LEATHER", "CLOTH"],
  Bonedancer: ["CLOTH"],
  Runemaster: ["CLOTH"],
  Spiritmaster: ["CLOTH"],
  Warlock: ["CLOTH"],
};

/**
 * Filter rule for armor items: returns true if this armor_type is suitable
 * for the chosen class. Items without an armor_type (jewelry, weapons) pass through.
 */
export function armorAllowedForClass(armorType: string | null, className: string | null): boolean {
  if (!armorType) return true;
  if (!className) return true;
  const allowed = CLASS_ARMOR[className];
  if (!allowed) return true;
  return allowed.includes(armorType.toUpperCase());
}

/**
 * Which primary "Acuity" stat each class actually uses.
 * Used to render the correct label ("Intelligence", "Piety", "Empathy", "Charisma")
 * on the Acuity row in the character summary.
 */
export const CLASS_ACUITY: Record<string, "INTELLIGENCE" | "PIETY" | "EMPATHY" | "CHARISMA"> = {
  // Albion casters / hybrids
  Wizard: "INTELLIGENCE", Sorcerer: "INTELLIGENCE", Theurgist: "INTELLIGENCE",
  Cabalist: "INTELLIGENCE", Necromancer: "INTELLIGENCE", Occultist: "INTELLIGENCE",
  Cleric: "PIETY", Friar: "PIETY", Paladin: "PIETY", Heretic: "PIETY", Reaver: "PIETY",
  Minstrel: "CHARISMA",
  // Hibernia
  Eldritch: "INTELLIGENCE", Enchanter: "INTELLIGENCE", Mentalist: "INTELLIGENCE",
  Animist: "INTELLIGENCE", Bainshee: "INTELLIGENCE", Valewalker: "INTELLIGENCE",
  Druid: "EMPATHY", Warden: "EMPATHY",
  Bard: "CHARISMA",
  // Midgard
  Runemaster: "PIETY", Spiritmaster: "PIETY", Bonedancer: "PIETY", Warlock: "PIETY",
  Healer: "PIETY", Shaman: "PIETY",
  Skald: "CHARISMA",
  Thane: "PIETY", Valkyrie: "PIETY",
};

/**
 * Skill IDs (matches SKILLS in spellcraft.ts) that each class can actually use.
 * Anything not listed gets hidden from the spellcraft Skills picker for that class.
 */
export const CLASS_SKILLS: Record<string, string[]> = {
  // Albion
  Armsman: ["TWO_HANDED", "CRUSH", "SLASH", "THRUST", "POLEARM", "PARRY", "SHIELD"],
  Paladin: ["CRUSH", "SLASH", "THRUST", "PARRY", "SHIELD", "SMITE"],
  Mercenary: ["CRUSH", "SLASH", "THRUST", "DUAL_WIELD", "PARRY"],
  Reaver: ["CRUSH", "SLASH", "THRUST", "FLEXIBLE", "SHIELD", "SOULRENDING"],
  Cleric: ["CRUSH", "SHIELD", "REJUVENATION", "ENHANCEMENT", "SMITE"],
  Friar: ["STAFF", "PARRY", "REJUVENATION", "ENHANCEMENT"],
  Heretic: ["CRUSH", "SHIELD", "REJUVENATION", "ENHANCEMENT"],
  Minstrel: ["SLASH", "THRUST", "STEALTH", "PARRY", "SHIELD"],
  Scout: ["SLASH", "THRUST", "STEALTH", "SHIELD", "PARRY"],
  Infiltrator: ["SLASH", "THRUST", "STEALTH", "ENVENOM", "CRITICAL_STRIKE", "DUAL_WIELD"],
  Wizard: ["COLD_MAGIC", "EARTH_MAGIC", "FIRE_MAGIC"],
  Sorcerer: ["BODY_MAGIC", "MIND_MAGIC", "MATTER_MAGIC"],
  Theurgist: ["EARTH_MAGIC", "COLD_MAGIC", "WIND_MAGIC"],
  Cabalist: ["BODY_MAGIC", "MATTER_MAGIC", "SPIRIT_MAGIC"],
  Necromancer: ["PAINWORKING", "DEATH_SERVANT", "DEATH_SIGHT"],
  Occultist: ["PAINWORKING", "DEATH_SIGHT", "SOULRENDING"],
  // Hibernia
  Hero: ["BLADES", "BLUNT", "PIERCING", "LARGE_WEAPONRY", "PARRY", "SHIELD"],
  Champion: ["BLADES", "BLUNT", "PIERCING", "LARGE_WEAPONRY", "PARRY", "SHIELD", "VALOR"],
  Warden: ["BLADES", "BLUNT", "PIERCING", "PARRY", "SHIELD", "REGROWTH", "NURTURE"],
  Druid: ["BLUNT", "REGROWTH", "NURTURE", "MENDING"],
  Bard: ["BLADES", "BLUNT", "MUSIC", "REGROWTH", "NURTURE"],
  Blademaster: ["BLADES", "BLUNT", "PIERCING", "CELTIC_DUAL", "PARRY"],
  Ranger: ["BLADES", "PIERCING", "CELTIC_DUAL", "STEALTH_HIB", "RECURVE_BOW"],
  Valewalker: ["SCYTHE", "PARRY"],
  Vampiir: ["PIERCING"],
  Nightshade: ["BLADES", "PIERCING", "CELTIC_DUAL", "STEALTH_HIB", "ENVENOM"],
  Animist: ["MANA", "ARBOREAL_PATH", "CREEPING_PATH", "VERDANT_PATH"],
  Bainshee: ["MENTALISM", "MUSIC"],
  Eldritch: ["LIGHT", "VOID", "MANA"],
  Enchanter: ["LIGHT", "MANA", "ENCHANTMENTS"],
  Mentalist: ["LIGHT", "MENTALISM", "MANA"],
  // Midgard
  Warrior: ["AXE", "HAMMER", "SWORD", "PARRY_MID", "SHIELD"],
  Thane: ["AXE", "HAMMER", "SWORD", "PARRY_MID", "SHIELD", "STORMCALLING"],
  Skald: ["AXE", "HAMMER", "SWORD", "BATTLESONGS", "PARRY_MID", "SHIELD"],
  Valkyrie: ["SWORD", "SPEAR", "PARRY_MID", "SHIELD", "MENDING"],
  Berserker: ["AXE", "HAMMER", "SWORD", "LEFT_AXE", "PARRY_MID"],
  Savage: ["AXE", "HAMMER", "SWORD", "HAND2HAND", "PARRY_MID"],
  Hunter: ["SWORD", "SPEAR", "COMPOSITE_BOW", "STEALTH_MID", "PARRY_MID"],
  Healer: ["MENDING", "AUGMENTATION", "PACIFICATION"],
  Shaman: ["MENDING", "AUGMENTATION", "DARKNESS"],
  Shadowblade: ["AXE", "SWORD", "LEFT_AXE", "STEALTH_MID", "ENVENOM", "CRITICAL_STRIKE"],
  Bonedancer: ["DARKNESS", "SUPPRESSION", "BONE_ARMY"],
  Runemaster: ["DARKNESS", "SUPPRESSION", "RUNECARVING"],
  Spiritmaster: ["DARKNESS", "SUPPRESSION"],
  Warlock: ["HEXING", "CURSING"],
};