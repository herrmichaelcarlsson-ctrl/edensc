import type { Realm } from "./types";

/**
 * DAoC race data. Base stats sourced from official Mythic class/race tables
 * (Camelot Herald / Eden 1.124).
 * STR / CON / DEX / QUI / INT / PIE / EMP / CHA
 */
export interface RaceDef {
  name: string;
  realm: Realm;
  baseStats: {
    STRENGTH: number;
    CONSTITUTION: number;
    DEXTERITY: number;
    QUICKNESS: number;
    INTELLIGENCE: number;
    PIETY: number;
    EMPATHY: number;
    CHARISMA: number;
  };
  /** Innate resists (% before items). Most races: +5 to one resist, +5 to a second if subrace. */
  innateResists?: Partial<Record<string, number>>;
}

/**
 * NOTE: All values are best-effort defaults from public DAoC data; they
 * intentionally lean on canonical Mythic values. Tweak in /admin/formulas
 * if Eden ships custom numbers later.
 */
export const RACES: RaceDef[] = [
  // ===== ALBION =====
  { name: "Briton",     realm: "Albion",   baseStats: { STRENGTH: 60, CONSTITUTION: 60, DEXTERITY: 60, QUICKNESS: 60, INTELLIGENCE: 60, PIETY: 60, EMPATHY: 60, CHARISMA: 60 } },
  { name: "Avalonian",  realm: "Albion",   baseStats: { STRENGTH: 45, CONSTITUTION: 45, DEXTERITY: 60, QUICKNESS: 70, INTELLIGENCE: 80, PIETY: 70, EMPATHY: 60, CHARISMA: 60 } },
  { name: "Highlander", realm: "Albion",   baseStats: { STRENGTH: 70, CONSTITUTION: 70, DEXTERITY: 50, QUICKNESS: 50, INTELLIGENCE: 60, PIETY: 60, EMPATHY: 60, CHARISMA: 60 }, innateResists: { RES_CRUSH: 2 } },
  { name: "Saracen",    realm: "Albion",   baseStats: { STRENGTH: 50, CONSTITUTION: 50, DEXTERITY: 80, QUICKNESS: 60, INTELLIGENCE: 60, PIETY: 60, EMPATHY: 60, CHARISMA: 60 }, innateResists: { RES_HEAT: 5 } },
  { name: "Inconnu",    realm: "Albion",   baseStats: { STRENGTH: 50, CONSTITUTION: 60, DEXTERITY: 70, QUICKNESS: 60, INTELLIGENCE: 70, PIETY: 60, EMPATHY: 60, CHARISMA: 60 }, innateResists: { RES_HEAT: 5, RES_COLD: 5, RES_MATTER: 5, RES_ENERGY: 5 } },
  { name: "Half Ogre",  realm: "Albion",   baseStats: { STRENGTH: 90, CONSTITUTION: 70, DEXTERITY: 40, QUICKNESS: 40, INTELLIGENCE: 70, PIETY: 60, EMPATHY: 60, CHARISMA: 60 } },
  { name: "Minotaur",   realm: "Albion",   baseStats: { STRENGTH: 80, CONSTITUTION: 70, DEXTERITY: 50, QUICKNESS: 50, INTELLIGENCE: 60, PIETY: 60, EMPATHY: 60, CHARISMA: 60 }, innateResists: { RES_HEAT: 5 } },

  // ===== HIBERNIA =====
  { name: "Celt",       realm: "Hibernia", baseStats: { STRENGTH: 60, CONSTITUTION: 60, DEXTERITY: 60, QUICKNESS: 60, INTELLIGENCE: 60, PIETY: 60, EMPATHY: 60, CHARISMA: 60 }, innateResists: { RES_SPIRIT: 5 } },
  { name: "Firbolg",    realm: "Hibernia", baseStats: { STRENGTH: 90, CONSTITUTION: 60, DEXTERITY: 40, QUICKNESS: 40, INTELLIGENCE: 60, PIETY: 70, EMPATHY: 90, CHARISMA: 60 }, innateResists: { RES_MATTER: 5 } },
  { name: "Elf",        realm: "Hibernia", baseStats: { STRENGTH: 40, CONSTITUTION: 40, DEXTERITY: 75, QUICKNESS: 75, INTELLIGENCE: 70, PIETY: 60, EMPATHY: 60, CHARISMA: 60 }, innateResists: { RES_SPIRIT: 5 } },
  { name: "Lurikeen",   realm: "Hibernia", baseStats: { STRENGTH: 40, CONSTITUTION: 40, DEXTERITY: 80, QUICKNESS: 80, INTELLIGENCE: 70, PIETY: 60, EMPATHY: 60, CHARISMA: 60 }, innateResists: { RES_ENERGY: 5 } },
  { name: "Sylvan",     realm: "Hibernia", baseStats: { STRENGTH: 70, CONSTITUTION: 60, DEXTERITY: 60, QUICKNESS: 50, INTELLIGENCE: 70, PIETY: 60, EMPATHY: 80, CHARISMA: 60 }, innateResists: { RES_MATTER: 5 } },
  { name: "Shar",       realm: "Hibernia", baseStats: { STRENGTH: 80, CONSTITUTION: 70, DEXTERITY: 50, QUICKNESS: 50, INTELLIGENCE: 60, PIETY: 60, EMPATHY: 60, CHARISMA: 60 }, innateResists: { RES_BODY: 5 } },
  { name: "Minotaur",   realm: "Hibernia", baseStats: { STRENGTH: 80, CONSTITUTION: 70, DEXTERITY: 50, QUICKNESS: 50, INTELLIGENCE: 60, PIETY: 60, EMPATHY: 60, CHARISMA: 60 }, innateResists: { RES_HEAT: 5 } },

  // ===== MIDGARD =====
  { name: "Norseman",   realm: "Midgard",  baseStats: { STRENGTH: 70, CONSTITUTION: 70, DEXTERITY: 50, QUICKNESS: 50, INTELLIGENCE: 60, PIETY: 60, EMPATHY: 60, CHARISMA: 60 }, innateResists: { RES_COLD: 5 } },
  { name: "Troll",      realm: "Midgard",  baseStats: { STRENGTH: 100, CONSTITUTION: 70, DEXTERITY: 35, QUICKNESS: 35, INTELLIGENCE: 60, PIETY: 60, EMPATHY: 60, CHARISMA: 60 }, innateResists: { RES_BODY: 5 } },
  { name: "Dwarf",      realm: "Midgard",  baseStats: { STRENGTH: 60, CONSTITUTION: 80, DEXTERITY: 50, QUICKNESS: 50, INTELLIGENCE: 60, PIETY: 60, EMPATHY: 60, CHARISMA: 60 }, innateResists: { RES_BODY: 5 } },
  { name: "Kobold",     realm: "Midgard",  baseStats: { STRENGTH: 50, CONSTITUTION: 50, DEXTERITY: 70, QUICKNESS: 70, INTELLIGENCE: 60, PIETY: 60, EMPATHY: 60, CHARISMA: 60 }, innateResists: { RES_ENERGY: 5 } },
  { name: "Valkyn",     realm: "Midgard",  baseStats: { STRENGTH: 55, CONSTITUTION: 45, DEXTERITY: 65, QUICKNESS: 75, INTELLIGENCE: 60, PIETY: 60, EMPATHY: 60, CHARISMA: 60 }, innateResists: { RES_SLASH: 2, RES_BODY: 5 } },
  { name: "Frostalf",   realm: "Midgard",  baseStats: { STRENGTH: 55, CONSTITUTION: 55, DEXTERITY: 55, QUICKNESS: 60, INTELLIGENCE: 60, PIETY: 75, EMPATHY: 60, CHARISMA: 60 }, innateResists: { RES_COLD: 5, RES_SPIRIT: 5 } },
  { name: "Minotaur",   realm: "Midgard",  baseStats: { STRENGTH: 80, CONSTITUTION: 70, DEXTERITY: 50, QUICKNESS: 50, INTELLIGENCE: 60, PIETY: 60, EMPATHY: 60, CHARISMA: 60 }, innateResists: { RES_HEAT: 5 } },
];

export function racesForRealm(realm: Realm | null): RaceDef[] {
  if (!realm) return [];
  return RACES.filter((r) => r.realm === realm);
}

export function findRace(realm: Realm | null, name: string | null): RaceDef | undefined {
  if (!realm || !name) return undefined;
  return RACES.find((r) => r.realm === realm && r.name === name);
}