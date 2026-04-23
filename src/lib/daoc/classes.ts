import type { Realm } from "./types";

export const CLASSES: Record<Realm, string[]> = {
  Albion: [
    "Armsman", "Cabalist", "Cleric", "Friar", "Heretic", "Infiltrator",
    "Mauler", "Mercenary", "Minstrel", "Necromancer", "Paladin", "Reaver",
    "Scout", "Sorcerer", "Theurgist", "Wizard",
  ],
  Hibernia: [
    "Animist", "Bainshee", "Bard", "Blademaster", "Champion", "Druid",
    "Eldritch", "Enchanter", "Hero", "Mauler", "Mentalist", "Nightshade",
    "Ranger", "Valewalker", "Vampiir", "Warden",
  ],
  Midgard: [
    "Berserker", "Bonedancer", "Healer", "Hunter", "Mauler", "Runemaster",
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