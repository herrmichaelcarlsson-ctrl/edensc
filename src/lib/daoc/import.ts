/**
 * Importer for Zenkcraft-style template summaries (.txt).
 * Parses the "Items" section into custom DBItems per slot.
 *
 * We use CUSTOM items so any item from another tool can be loaded
 * without needing a matching DB entry. Spellcraft sections are
 * imported as gems on the slot when possible.
 */
import type { DBItem, ItemEffect, Realm, SlotKey, TemplateSlots } from "./types";
import { CAPS } from "./caps";
import { GEMS, type GemDef, type SpellcraftMap } from "./spellcraft";
import { SLOTS } from "./slots";

const SLOT_HEADERS: Record<string, SlotKey> = {
  "helmet": "HELMETS",
  "head": "HELMETS",
  "hands": "GLOVES",
  "gloves": "GLOVES",
  "torso": "CHEST",
  "chest": "CHEST",
  "arms": "ARMS",
  "sleeves": "ARMS",
  "feet": "SHOES",
  "boots": "SHOES",
  "legs": "LEGS",
  "right hand": "RIGHT_HAND",
  "left hand": "LEFT_HAND",
  "two handed": "TWO_HANDED",
  "ranged": "RANGED",
  "neck": "NECKLACE",
  "necklace": "NECKLACE",
  "cloak": "CLOAK",
  "jewelry": "JEWEL",
  "jewel": "JEWEL",
  "waist": "BELT",
  "belt": "BELT",
  "l ring": "RING_1",
  "r ring": "RING_2",
  "left ring": "RING_1",
  "right ring": "RING_2",
  "l wrist": "BRACER_1",
  "r wrist": "BRACER_2",
  "left wrist": "BRACER_1",
  "right wrist": "BRACER_2",
  "mythical": "MYTHICAL",
  "mythirian": "MYTHICAL",
};

interface ParsedBonus {
  kind: string; // Stat / Resist / Skill / Stat_Cap / Bonus / Bonus_Cap / Focus
  label: string;
  value: number;
  isPct: boolean;
  gemQuality?: string;
  gemFamily?: string;
}

interface ParsedItem {
  slotKey: SlotKey;
  name: string;
  level: number;
  quality: number;
  sourceType: string;
  bonuses: ParsedBonus[];
}

function normalizeSlotHeader(line: string): SlotKey | null {
  const k = line.trim().toLowerCase();
  return SLOT_HEADERS[k] ?? null;
}

/* Map "Strength" → "STRENGTH", "Cap Acuity" → "CAP_ACUITY" etc. */
function effectIdFromLabel(kind: string, label: string): string | null {
  const norm = label.trim();
  // Stat caps
  if (kind === "Stat_Cap") {
    const stripped = norm.replace(/^cap\s+/i, "").trim();
    const found = Object.entries(CAPS).find(([, v]) => v.label.toLowerCase() === stripped.toLowerCase());
    if (!found) return null;
    return `CAP_${found[0]}`;
  }
  if (kind === "Bonus_Cap") {
    return `MCAP_${norm.toUpperCase().replace(/\s+/g, "_")}`;
  }
  // Find by exact label match in CAPS
  const found = Object.entries(CAPS).find(([, v]) => v.label.toLowerCase() === norm.toLowerCase());
  if (found) return found[1].effectIds[0];
  // Resists fallback ("Body" etc.)
  if (kind === "Resist") {
    const key = `RES_${norm.toUpperCase()}`;
    if (CAPS[key]) return key;
  }
  // Stats fallback
  const key = norm.toUpperCase().replace(/\s+/g, "_");
  if (CAPS[key]) return CAPS[key].effectIds[0];
  // Skills / unknown — keep as is
  return key;
}

function parseBonusLine(line: string): ParsedBonus | null {
  // "1. (Stat) Hit Points: +30"
  // "1. (Stat) Hit Points: +68 [(Flawless) Blood Essence Jewel]"
  const m = line.match(/^\s*\d+\.\s*\(([^)]+)\)\s*([^:]+):\s*\+?(-?\d+(?:\.\d+)?)(%?)\s*(?:\[\(([^)]+)\)\s*([^\]]+)\])?\s*$/);
  if (!m) return null;
  const [, kind, label, val, pct, gemQuality, gemFamily] = m;
  return {
    kind: kind.trim(),
    label: label.trim(),
    value: Number(val),
    isPct: pct === "%",
    gemQuality: gemQuality?.trim(),
    gemFamily: gemFamily?.trim(),
  };
}

function parseItems(text: string): ParsedItem[] {
  const lines = text.split(/\r?\n/);
  // Find "Items" header
  let start = lines.findIndex((l) => l.trim().toLowerCase() === "items");
  if (start === -1) start = 0;

  const items: ParsedItem[] = [];
  let cur: ParsedItem | null = null;

  const finalize = () => {
    if (cur) items.push(cur);
    cur = null;
  };

  for (let i = start + 1; i < lines.length; i++) {
    const raw = lines[i];
    const line = raw.trim();
    if (!line) continue;

    const slotKey = normalizeSlotHeader(line);
    if (slotKey) {
      finalize();
      cur = {
        slotKey,
        name: "",
        level: 51,
        quality: 100,
        sourceType: "Loot",
        bonuses: [],
      };
      continue;
    }
    if (!cur) continue;

    if (/^name\s*:/i.test(line)) {
      cur.name = line.replace(/^name\s*:\s*/i, "").trim();
      continue;
    }
    if (/^level\s*:/i.test(line)) {
      const m = line.match(/level\s*:\s*(\d+).*?(\d+)%/i);
      if (m) {
        cur.level = Number(m[1]);
        cur.quality = Number(m[2]);
      }
      continue;
    }
    if (/^source\s*type\s*:/i.test(line)) {
      cur.sourceType = line.replace(/^source\s*type\s*:\s*/i, "").trim();
      continue;
    }
    if (/^utility\s*:/i.test(line) || /^imbue\s*points\s*:/i.test(line)) {
      continue;
    }
    const bonus = parseBonusLine(line);
    if (bonus) cur.bonuses.push(bonus);
  }
  finalize();
  return items;
}

function findGem(family: string, quality: string, value: number): GemDef | undefined {
  // First try exact (quality + family)
  let g = GEMS.find((gm) => gm.family.toLowerCase() === family.toLowerCase()
                          && gm.quality.toLowerCase() === quality.toLowerCase());
  if (g) return g;
  // Then by family + closest value
  const family_matches = GEMS.filter((gm) => gm.family.toLowerCase() === family.toLowerCase());
  if (family_matches.length === 0) return undefined;
  family_matches.sort((a, b) => Math.abs(a.value - value) - Math.abs(b.value - value));
  return family_matches[0];
}

export interface ImportResult {
  templateName: string;
  realm: Realm | null;
  className: string | null;
  items: Record<string, DBItem>;
  slots: TemplateSlots;
  spellcraft: SpellcraftMap;
}

export function importZenkcraftText(text: string, fallbackRealm: Realm | null = null): ImportResult {
  const nameMatch = text.match(/Character Summary for\s+(.+?)\s*(?:\(Level\s*\d+\))?\s*(?:-\s*([A-Za-z]+))?\s*$/im);
  const templateName = nameMatch?.[1]?.trim() || "Imported Template";
  const className = nameMatch?.[2]?.trim() || null;
  const realmMatch = text.match(/Realm\s*:\s*(Albion|Hibernia|Midgard)/i);
  const realm = (realmMatch?.[1] as Realm) ?? fallbackRealm;

  const parsed = parseItems(text);
  const items: Record<string, DBItem> = {};
  const slots: TemplateSlots = {};
  const spellcraft: SpellcraftMap = {};

  for (const p of parsed) {
    if (!p.name && p.bonuses.length === 0) continue; // empty slot
    const slotDef = SLOTS.find((s) => s.key === p.slotKey);
    const isSC = /spellcraft/i.test(p.sourceType);

    // Build native effects (item-only, NOT gem bonuses if SC)
    const nativeEffects: ItemEffect[] = [];
    const gemIds: string[] = [];

    for (const b of p.bonuses) {
      const effId = effectIdFromLabel(b.kind, b.label);
      if (!effId) continue;
      if (isSC && b.gemFamily && b.gemQuality) {
        const gem = findGem(b.gemFamily, b.gemQuality, b.value);
        if (gem) { gemIds.push(gem.id); continue; }
      }
      if (isSC) {
        // SC item without gem tag — still record value but try to match gem by effect
        const gem = GEMS
          .filter((gm) => gm.effectId === effId)
          .sort((a, b2) => Math.abs(a.value - b.value) - Math.abs(b2.value - b.value))[0];
        if (gem) { gemIds.push(gem.id); continue; }
      }
      nativeEffects.push({ id: effId, value: b.value });
    }

    const id = `imported:${p.slotKey}:${crypto.randomUUID()}`;
    const item: DBItem = {
      id,
      external_id: null,
      name: p.name || `Crafted ${slotDef?.label ?? p.slotKey}`,
      realm: realm ?? "Albion",
      slot: slotDef?.dbSlots[0] ?? p.slotKey,
      item_level: p.level,
      bonus_level: p.level,
      required_level: 50,
      quality: p.quality,
      level: p.level,
      class_restriction: className,
      armor_type: null,
      armor_af: null,
      weapon_type: null,
      weapon_damage_type: null,
      weapon_dps: null,
      weapon_speed: null,
      origin: isSC ? "CRAFTED" : "IMPORTED",
      source_type: isSC ? "CRAFTED" : (p.sourceType || "IMPORTED"),
      online_url: null,
      effects: nativeEffects,
    };

    items[id] = item;
    slots[p.slotKey] = id;
    if (gemIds.length) spellcraft[p.slotKey] = gemIds;
  }

  return { templateName, realm, className, items, slots, spellcraft };
}
