/**
 * Auto-spellcraft: given current items + per-stat target caps (e.g. STR=101),
 * fill all craftable slots with gem combos that get as close as possible to
 * the targets while respecting:
 *   - 4 gems per item
 *   - safe imbue limit of 32 (highest gem cost + sum(rest)/2)
 *   - per-effect total cap (so we don't waste on already-capped stats)
 *
 * Strategy: greedy. For every craftable slot, repeat up to 4 times:
 *   pick the (effect, gem) pair that closes the largest absolute gap
 *   while still fitting into the imbue budget. Skip if no useful gem fits.
 */

import type { DBItem, SlotKey } from "./types";
import {
  GEMS, GEM_BY_ID, isCraftable, gemsToEffects,
  MAX_GEMS_PER_ITEM, SAFE_IMBUE_LIMIT, type GemSet, type SpellcraftMap,
} from "./spellcraft";
import { calcImbueUsed } from "./formulas";
import { CAPS } from "./caps";

export type CapTarget = Partial<Record<string, number>>;

/** Sum a set of gem costs the formula way (highest + rest/2). */
function imbueOf(set: GemSet): number {
  const costs = set.map((id) => GEM_BY_ID[id]?.cost ?? 0);
  return calcImbueUsed(costs);
}

/**
 * Compute per-effect totals from items + current spellcraft map (excluding
 * the slot we're optimising).
 */
function totalsExcept(
  itemsBySlot: Partial<Record<SlotKey, DBItem | undefined>>,
  spellcraft: SpellcraftMap,
  excludeSlot: SlotKey,
): Map<string, number> {
  const totals = new Map<string, number>();
  for (const k of Object.keys(itemsBySlot) as SlotKey[]) {
    const it = itemsBySlot[k];
    if (it) for (const e of it.effects ?? []) totals.set(e.id, (totals.get(e.id) ?? 0) + e.value);
    if (k !== excludeSlot) {
      for (const e of gemsToEffects(spellcraft[k])) {
        totals.set(e.id, (totals.get(e.id) ?? 0) + e.value);
      }
    }
  }
  return totals;
}

/** Cap-aware gap for an effect: min(target − current, hardCap − current). */
function gapFor(effectId: string, current: number, targets: CapTarget): number {
  const target = targets[effectId];
  if (!target) return 0;
  // Look up the cap def that owns this effect to clamp at the hard cap.
  let hardCap = target;
  for (const def of Object.values(CAPS)) {
    if (def.effectIds.includes(effectId)) {
      hardCap = def.hardCap ?? def.itemCap;
      break;
    }
  }
  return Math.max(0, Math.min(target, hardCap) - current);
}

/**
 * Pick the single best gem to add to `currentSet` for this slot, given live
 * effect totals and targets. Returns null if no gem helps.
 */
function bestGemFor(
  currentSet: GemSet,
  totals: Map<string, number>,
  targets: CapTarget,
): string | null {
  if (currentSet.length >= MAX_GEMS_PER_ITEM) return null;

  const needed = Object.keys(targets).filter((eff) => gapFor(eff, totals.get(eff) ?? 0, targets) > 0);
  if (needed.length === 0) return null;

  let best: { id: string; score: number } | null = null;
  for (const g of GEMS) {
    if (!needed.includes(g.effectId)) continue;
    const trial = [...currentSet, g.id];
    if (imbueOf(trial) > SAFE_IMBUE_LIMIT) continue;
    const cur = totals.get(g.effectId) ?? 0;
    const gap = gapFor(g.effectId, cur, targets);
    const useful = Math.min(g.value, gap);          // points that actually reduce the gap
    if (useful <= 0) continue;
    const waste = g.value - useful;                  // overflow we'd add
    // Score: maximise useful / cost, penalise waste.
    const score = useful * 10 - waste * 4 - g.cost * 0.5;
    if (!best || score > best.score) best = { id: g.id, score };
  }
  return best?.id ?? null;
}

/**
 * Autocraft an entire template. Mutates nothing — returns a NEW SpellcraftMap.
 * Only craftable items are considered; existing gems on craftable slots are
 * cleared so the optimiser starts fresh.
 */
export function autocraftTemplate(
  itemsBySlot: Partial<Record<SlotKey, DBItem | undefined>>,
  spellcraft: SpellcraftMap,
  targets: CapTarget,
): SpellcraftMap {
  const next: SpellcraftMap = { ...spellcraft };
  const slots = (Object.keys(itemsBySlot) as SlotKey[]).filter((k) => isCraftable(itemsBySlot[k]));

  // Clear craftable slots so we re-optimise from scratch.
  for (const k of slots) next[k] = [];

  // Multi-pass: keep filling while at least one gem was placed last pass,
  // so slots can rebalance based on what other slots already covered.
  let changed = true;
  let safety = 4;
  while (changed && safety-- > 0) {
    changed = false;
    for (const slot of slots) {
      const set = next[slot] ?? [];
      while ((set.length ?? 0) < MAX_GEMS_PER_ITEM) {
        const totals = totalsExcept(itemsBySlot, next, slot);
        // Add this slot's current gems back into totals.
        for (const e of gemsToEffects(set)) totals.set(e.id, (totals.get(e.id) ?? 0) + e.value);
        const pick = bestGemFor(set, totals, targets);
        if (!pick) break;
        set.push(pick);
        changed = true;
      }
      next[slot] = set;
    }
  }
  return next;
}