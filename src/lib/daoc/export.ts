import type { DBItem, SlotKey } from "./types";
import { SLOT_BY_KEY } from "./slots";
import { CAPS } from "./caps";
import type { AggregateResult } from "./aggregate";
import { GEM_BY_ID, isCraftable, inspectGems, type GemDef, type SpellcraftMap } from "./spellcraft";

const fmtPts = (n: number) => (Number.isInteger(n) ? `${n}` : n.toFixed(1));

/* ---------- Slot order matching Zenkcraft layout ---------- */
const EXPORT_SLOT_ORDER: SlotKey[] = [
  "HELMETS", "GLOVES", "CHEST", "ARMS", "SHOES", "LEGS",
  "RIGHT_HAND", "LEFT_HAND", "TWO_HANDED", "RANGED",
  "NECKLACE", "CLOAK", "JEWEL", "BELT",
  "RING_1", "RING_2", "BRACER_1", "BRACER_2", "MYTHICAL",
];

const SLOT_EXPORT_LABEL: Partial<Record<SlotKey, string>> = {
  HELMETS: "Helmet",
  GLOVES: "Hands",
  CHEST: "Torso",
  ARMS: "Arms",
  SHOES: "Feet",
  LEGS: "Legs",
  RIGHT_HAND: "Right Hand",
  LEFT_HAND: "Left Hand",
  TWO_HANDED: "Two Handed",
  RANGED: "Ranged",
  NECKLACE: "Neck",
  CLOAK: "Cloak",
  JEWEL: "Jewelry",
  BELT: "Waist",
  RING_1: "L Ring",
  RING_2: "R Ring",
  BRACER_1: "L Wrist",
  BRACER_2: "R Wrist",
  MYTHICAL: "Mythical",
};

/* ---------- Effect-id → human label / kind ---------- */
interface EffectMeta {
  label: string;
  kind: "Stat" | "Resist" | "Skill" | "Bonus" | "Stat_Cap" | "Bonus_Cap" | "Focus";
  isPct?: boolean;
}

function effectMeta(id: string): EffectMeta {
  // Stat caps
  if (id.startsWith("CAP_")) {
    const base = id.slice(4);
    const cap = CAPS[base];
    return { label: `Cap ${cap?.label ?? titleCase(base)}`, kind: "Stat_Cap" };
  }
  if (id.startsWith("MCAP_")) {
    const base = id.slice(5);
    return { label: titleCase(base), kind: "Bonus_Cap" };
  }
  // Resists
  if (id.startsWith("RES_")) {
    const cap = CAPS[id];
    return { label: cap?.label ?? titleCase(id.slice(4)), kind: "Resist", isPct: true };
  }
  // Known cap entry
  const cap = CAPS[id];
  if (cap) {
    if (cap.group === "stat") return { label: cap.label, kind: "Stat" };
    if (cap.group === "vital") return { label: cap.label.replace(" %", ""), kind: cap.kind === "power" ? "Bonus" : "Stat", isPct: cap.kind === "power" };
    if (cap.group === "bonus") return { label: cap.label, kind: "Bonus", isPct: cap.kind === "bonusPct" };
  }
  // Focus
  if (id.includes("FOCUS")) return { label: titleCase(id), kind: "Focus" };
  // Skill / fallback
  return { label: titleCase(id), kind: "Skill" };
}

function titleCase(id: string): string {
  return id
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function fmtValue(value: number, meta: EffectMeta): string {
  return meta.isPct ? `+${value}%` : `+${value}`;
}

/* ---------- Build per-item gem lookup keyed by effect ---------- */
function gemForEffect(gems: GemDef[], effectId: string, value: number): GemDef | undefined {
  // Find gem of same effectId whose value matches; otherwise any of same effectId.
  const same = gems.filter((g) => g.effectId === effectId);
  return same.find((g) => g.value === value) ?? same[0];
}

/* ---------- Item bonus aggregation (item native + gems merged for display) ---------- */
interface ItemBonus {
  effectId: string;
  value: number;
  source: "item" | "gem";
  gem?: GemDef;
}

function bonusesFor(item: DBItem, gemIds: string[] | undefined): ItemBonus[] {
  const out: ItemBonus[] = [];
  for (const eff of item.effects ?? []) {
    out.push({ effectId: eff.id, value: eff.value, source: "item" });
  }
  for (const id of gemIds ?? []) {
    const gem = GEM_BY_ID[id];
    if (!gem) continue;
    out.push({ effectId: gem.effectId, value: gem.value, source: "gem", gem });
  }
  return out;
}

/* ---------- Main export ---------- */
export function exportTemplateText(
  templateName: string,
  realm: string,
  className: string | null,
  itemsBySlot: Partial<Record<SlotKey, DBItem | undefined>>,
  agg: AggregateResult,
  spellcraft: SpellcraftMap = {},
): string {
  const L: string[] = [];
  const now = new Date();
  const dateStr = now.toLocaleString("en-US", {
    hour: "2-digit", minute: "2-digit", hour12: true,
    month: "short", day: "2-digit", year: "numeric",
  });

  L.push("Eden Template Forge");
  L.push("https://templateforge.app");
  L.push(`Last Saved: ${dateStr}`);
  L.push("");
  L.push(`Character Summary for ${templateName} (Level 50) - ${className ?? "Unknown"}`);
  L.push(`Realm: ${realm}`);
  L.push("Note: All items are included. Stats shown below reflect only currently equipped items.");
  L.push("");

  /* ---- STATS ---- */
  L.push("Stats");
  const statKeys = ["STRENGTH", "CONSTITUTION", "DEXTERITY", "QUICKNESS",
                    "INTELLIGENCE", "PIETY", "CHARISMA", "EMPATHY", "ACUITY"];
  for (const k of statKeys) {
    const s = agg.stats.find((x) => x.key === k);
    if (!s) continue;
    if (s.current === 0 && k === "ACUITY") continue;
    L.push(`${s.current} / ${s.effectiveCap}  ${s.label}`);
  }
  const hp = agg.stats.find((x) => x.key === "HITPOINTS");
  if (hp) L.push(`${hp.current} / ${hp.effectiveCap}  Hit Points`);
  const pwr = agg.stats.find((x) => x.key === "POWER");
  if (pwr) L.push(`${pwr.current} / ${pwr.effectiveCap}  Power`);
  L.push("");

  /* ---- BONUSES ---- */
  L.push("Bonuses");
  for (const s of agg.stats) {
    if (s.group !== "bonus" || s.current === 0) continue;
    L.push(`${s.label}: ${s.current}%`);
  }
  L.push("");

  /* ---- RESISTS ---- */
  L.push("Resists (Racials not included)");
  const resistOrder = ["RES_CRUSH", "RES_SLASH", "RES_THRUST", "RES_COLD",
                       "RES_ENERGY", "RES_HEAT", "RES_MATTER", "RES_SPIRIT", "RES_BODY"];
  for (const k of resistOrder) {
    const s = agg.stats.find((x) => x.key === k);
    if (!s) continue;
    L.push(`${s.current}% ${s.label}`);
  }
  L.push("");

  /* ---- SKILLS ---- */
  if (agg.skills.length) {
    L.push("Skills");
    for (const s of agg.skills) L.push(`${s.value} ${titleCase(s.id)}`);
    L.push("");
  }

  L.push("Item Procs and Charges");
  L.push("");
  L.push("");
  L.push("Items");
  L.push("");

  /* ---- ITEMS ---- */
  for (const slotKey of EXPORT_SLOT_ORDER) {
    const item = itemsBySlot[slotKey];
    const gemIds = spellcraft[slotKey];
    const isSC = !!gemIds && gemIds.length > 0;

    L.push("");
    L.push(SLOT_EXPORT_LABEL[slotKey] ?? SLOT_BY_KEY[slotKey]?.label ?? slotKey);

    if (!item && !isSC) {
      L.push("Name: ");
      L.push("Level: 51 (100% Quality)");
      L.push("Source Type: Empty");
      continue;
    }

    if (item) {
      L.push(`Name: ${item.name}`);
      const q = item.quality ?? 100;
      L.push(`Level: ${item.level ?? 51} (${q}% Quality)`);
      const srcType = isSC && isCraftable(item)
        ? "Spellcraft"
        : (item.source_type ?? item.origin ?? "Loot");
      L.push(`Source Type: ${srcType}`);
      if (isSC) {
        const status = inspectGems(gemIds);
        L.push(`Imbue Points: ${fmtPts(status.imbueUsed)} of 32`);
      }

      const list = bonusesFor(item, gemIds);
      const gems = (gemIds ?? []).map((id) => GEM_BY_ID[id]).filter(Boolean) as GemDef[];
      list.forEach((b, i) => {
        const meta = effectMeta(b.effectId);
        const gem = b.source === "gem"
          ? b.gem
          : (isSC ? gemForEffect(gems, b.effectId, b.value) : undefined);
        const tail = gem ? ` [(${gem.quality}) ${gem.family}]` : "";
        L.push(`${i + 1}. (${meta.kind}) ${meta.label}: ${fmtValue(b.value, meta)}${tail}`);
      });
    } else {
      // Spellcraft-only shell (no item but gems exist) — rare
      L.push("Name: ");
      L.push("Level: 51 (99% Quality)");
      L.push("Source Type: Spellcraft");
      const status = inspectGems(gemIds);
      L.push(`Imbue Points: ${fmtPts(status.imbueUsed)} of 32`);
      gemIds!.forEach((gid, i) => {
        const gem = GEM_BY_ID[gid];
        if (!gem) return;
        const meta = effectMeta(gem.effectId);
        L.push(`${i + 1}. (${meta.kind}) ${meta.label}: ${fmtValue(gem.value, meta)} [(${gem.quality}) ${gem.family}]`);
      });
    }
    L.push("");
  }

  /* ---- SHOPPING LIST FOR SPELLCRAFTER ---- */
  L.push("");
  L.push("============================================");
  L.push("  SPELLCRAFT SHOPPING LIST (for crafter)");
  L.push("============================================");
  L.push("");

  const tally = new Map<string, { gem: GemDef; count: number }>();
  for (const slotKey of EXPORT_SLOT_ORDER) {
    const ids = spellcraft[slotKey];
    if (!ids) continue;
    for (const id of ids) {
      const gem = GEM_BY_ID[id];
      if (!gem) continue;
      const key = gem.gemName;
      const cur = tally.get(key);
      if (cur) cur.count += 1;
      else tally.set(key, { gem, count: 1 });
    }
  }

  if (tally.size === 0) {
    L.push("(No spellcraft gems in this template.)");
  } else {
    // Per item, then totals
    L.push("--- Per Item ---");
    for (const slotKey of EXPORT_SLOT_ORDER) {
      const ids = spellcraft[slotKey];
      if (!ids || !ids.length) continue;
      const slotLabel = SLOT_EXPORT_LABEL[slotKey] ?? slotKey;
      const item = itemsBySlot[slotKey];
      L.push("");
      L.push(`[${slotLabel}] ${item?.name ?? "(crafted shell)"}`);
      const status = inspectGems(ids);
      L.push(`  Imbue: ${fmtPts(status.imbueUsed)}/32 ${status.overcharge ? "(OVERCHARGE)" : ""}`);
      ids.forEach((id, i) => {
        const gem = GEM_BY_ID[id];
        if (!gem) return;
        L.push(`  ${i + 1}. ${gem.gemName.padEnd(36)}  →  ${gem.label}`);
      });
    }

    L.push("");
    L.push("--- Totals (gems to craft / buy) ---");
    const sorted = Array.from(tally.values()).sort((a, b) =>
      a.gem.gemName.localeCompare(b.gem.gemName),
    );
    const nameWidth = Math.max(...sorted.map((e) => e.gem.gemName.length));
    for (const { gem, count } of sorted) {
      L.push(`  ${String(count).padStart(2)}x  ${gem.gemName.padEnd(nameWidth)}  (${fmtPts(gem.cost)} imbue)`);
    }
  }

  L.push("");
  return L.join("\n");
}
