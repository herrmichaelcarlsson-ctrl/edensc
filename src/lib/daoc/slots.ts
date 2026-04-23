import type { SlotKey } from "./types";

export interface SlotDef {
  key: SlotKey;
  label: string;
  /** DB slot values that can fit this template slot */
  dbSlots: string[];
  group: "armor" | "weapon" | "jewelry";
}

export const SLOTS: SlotDef[] = [
  { key: "HELMETS", label: "Head", dbSlots: ["HELMETS", "HELMET"], group: "armor" },
  { key: "CHEST", label: "Torso", dbSlots: ["CHEST"], group: "armor" },
  { key: "ARMS", label: "Arms", dbSlots: ["ARMS"], group: "armor" },
  { key: "GLOVES", label: "Hands", dbSlots: ["GLOVES"], group: "armor" },
  { key: "LEGS", label: "Legs", dbSlots: ["LEGS"], group: "armor" },
  { key: "SHOES", label: "Feet", dbSlots: ["SHOES", "BOOTS"], group: "armor" },

  { key: "RIGHT_HAND", label: "Right Hand", dbSlots: ["WEAPONS"], group: "weapon" },
  { key: "LEFT_HAND", label: "Left Hand", dbSlots: ["WEAPONS", "SHIELD"], group: "weapon" },
  { key: "TWO_HANDED", label: "Two Handed", dbSlots: ["WEAPONS"], group: "weapon" },
  { key: "RANGED", label: "Ranged", dbSlots: ["WEAPONS"], group: "weapon" },

  { key: "NECKLACE", label: "Neck", dbSlots: ["NECKLACE"], group: "jewelry" },
  { key: "CLOAK", label: "Cloak", dbSlots: ["CLOAK"], group: "jewelry" },
  { key: "JEWEL", label: "Jewel", dbSlots: ["JEWEL"], group: "jewelry" },
  { key: "BELT", label: "Belt", dbSlots: ["BELT"], group: "jewelry" },
  { key: "RING_1", label: "Ring 1", dbSlots: ["RINGS", "RING"], group: "jewelry" },
  { key: "RING_2", label: "Ring 2", dbSlots: ["RINGS", "RING"], group: "jewelry" },
  { key: "BRACER_1", label: "Bracer 1", dbSlots: ["BRACERS", "BRACELETS"], group: "jewelry" },
  { key: "BRACER_2", label: "Bracer 2", dbSlots: ["BRACERS", "BRACELETS"], group: "jewelry" },
  { key: "MYTHICAL", label: "Mythirian", dbSlots: ["MYTHICAL"], group: "jewelry" },
];

export const SLOT_BY_KEY: Record<SlotKey, SlotDef> = Object.fromEntries(
  SLOTS.map((s) => [s.key, s]),
) as Record<SlotKey, SlotDef>;