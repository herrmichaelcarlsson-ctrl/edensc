export type Realm = "Albion" | "Hibernia" | "Midgard";

export type SlotKey =
  | "HELMETS"
  | "CHEST"
  | "ARMS"
  | "GLOVES"
  | "LEGS"
  | "SHOES"
  | "RIGHT_HAND"
  | "LEFT_HAND"
  | "TWO_HANDED"
  | "RANGED"
  | "NECKLACE"
  | "CLOAK"
  | "JEWEL"
  | "BELT"
  | "RING_1"
  | "RING_2"
  | "BRACER_1"
  | "BRACER_2"
  | "MYTHICAL";

export interface ItemEffect {
  id: string;
  value: number;
}

export interface DBItem {
  id: string;
  external_id: string | null;
  name: string;
  realm: string;
  slot: string; // raw slot from DB (WEAPONS / CHEST / ...)
  item_level: number | null;
  bonus_level: number | null;
  required_level: number | null;
  quality: number | null;
  level: number | null;
  class_restriction: string | null;
  armor_type: string | null;
  armor_af: number | null;
  weapon_type: string | null;
  weapon_damage_type: string | null;
  weapon_dps: number | null;
  weapon_speed: number | null;
  origin: string | null;
  source_type: string | null;
  online_url: string | null;
  effects: ItemEffect[];
}

export type TemplateSlots = Partial<Record<SlotKey, string>>; // SlotKey -> item id

export interface Template {
  id?: string;
  name: string;
  realm: Realm;
  class_name: string | null;
  slots: TemplateSlots;
  notes?: string | null;
}