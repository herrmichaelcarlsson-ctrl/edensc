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