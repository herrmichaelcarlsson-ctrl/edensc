import type { DBItem, SlotKey } from "./types";
import { SLOT_BY_KEY } from "./slots";
import type { AggregateResult } from "./aggregate";

export function exportTemplateText(
  templateName: string,
  realm: string,
  className: string | null,
  itemsBySlot: Partial<Record<SlotKey, DBItem | undefined>>,
  agg: AggregateResult,
): string {
  const lines: string[] = [];
  lines.push(`=== ${templateName} ===`);
  lines.push(`${realm}${className ? " — " + className : ""}`);
  lines.push(`Score: ${agg.score}/100`);
  lines.push("");
  lines.push("--- ITEMS ---");
  for (const slotKey of Object.keys(SLOT_BY_KEY) as SlotKey[]) {
    const def = SLOT_BY_KEY[slotKey];
    const it = itemsBySlot[slotKey];
    if (!it) continue;
    lines.push(`[${def.label.padEnd(12)}] ${it.name}`);
  }
  lines.push("");
  lines.push("--- STATS ---");
  for (const s of agg.stats) {
    if (s.current === 0) continue;
    const cap = s.effectiveCap;
    const tag =
      s.status === "capped" ? "✓" :
      s.status === "waste" ? `! +${s.waste} waste` :
      s.status === "near" ? "~" : "·";
    lines.push(`${s.label.padEnd(20)} ${String(s.current).padStart(4)} / ${String(cap).padEnd(4)} ${tag}`);
  }
  if (agg.skills.length) {
    lines.push("");
    lines.push("--- SKILLS ---");
    for (const s of agg.skills) lines.push(`${s.id.padEnd(20)} +${s.value}`);
  }
  return lines.join("\n");
}