/**
 * Gem suggestions: analyze missing stats/resists vs caps and propose minimum gems
 * needed to fill the gap. Each gem provides ONE bonus.
 */

import type { AggregateResult } from "./aggregate";
import { GEMS, type GemDef } from "./spellcraft";

export interface MissingEntry {
  effectId: string;
  label: string;
  missing: number;
  cap: number;
  current: number;
  group: "stat" | "resist" | "vital" | "bonus" | "skill";
  suggestion?: GemDef;
}

export interface SuggestionResult {
  entries: MissingEntry[];
  /** Gems needed (one per missing slot, regardless of items available) */
  gemsNeeded: number;
}

/**
 * For each capped category that has a gap, suggest the smallest gem that
 * covers it (one per stat/resist).
 */
export function suggestGems(agg: AggregateResult): SuggestionResult {
  const entries: MissingEntry[] = [];
  for (const s of agg.stats) {
    if (s.group !== "stat" && s.group !== "resist") continue;
    const gap = s.effectiveCap - s.current;
    if (gap <= 0) continue;
    const candidates = GEMS
      .filter((g) => g.effectId === s.key)
      .sort((a, b) => a.cost - b.cost);
    // Find the smallest gem >= gap, otherwise the largest available
    const fit = candidates.find((g) => g.value >= gap) ?? candidates[candidates.length - 1];
    entries.push({
      effectId: s.key,
      label: s.label,
      missing: gap,
      cap: s.effectiveCap,
      current: s.current,
      group: s.group as MissingEntry["group"],
      suggestion: fit,
    });
  }
  return {
    entries: entries.sort((a, b) => b.missing - a.missing),
    gemsNeeded: entries.length,
  };
}
