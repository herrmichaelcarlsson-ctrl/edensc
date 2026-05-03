import { useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, AlertTriangle } from "lucide-react";
import {
  GEMS,
  GEM_BY_ID,
  inspectGems,
  MAX_GEMS_PER_ITEM,
  SAFE_IMBUE_LIMIT,
  type GemCategory,
  type GemSet,
} from "@/lib/daoc/spellcraft";
import type { DBItem, Realm, SlotKey } from "@/lib/daoc/types";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onClose: () => void;
  slot: SlotKey | null;
  item: DBItem | undefined;
  gems: GemSet;
  onChange: (gems: GemSet) => void;
  realm: Realm | null;
}

const fmtPts = (n: number) => (Number.isInteger(n) ? `${n}` : n.toFixed(1));

const CATEGORIES: { key: GemCategory; label: string }[] = [
  { key: "stat", label: "Stats" },
  { key: "skill", label: "Skills" },
  { key: "resist", label: "Resists" },
  { key: "hp", label: "Hit Points" },
  { key: "power", label: "Power" },
];

export function SpellcraftDialog({ open, onClose, slot, item, gems, onChange, realm }: Props) {
  const status = useMemo(() => inspectGems(gems), [gems]);

  function effectsForCategory(category: GemCategory) {
    const map = new Map<string, { id: string; label: string }>();
    for (const g of GEMS) {
      if (g.category !== category) continue;
      if (g.category === "skill" && realm && g.realm !== realm) continue;
      if (!map.has(g.effectId)) {
        const label = g.label.replace(/^\+\d+%?\s*/, "").trim();
        map.set(g.effectId, { id: g.effectId, label });
      }
    }
    return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label));
  }
  function tiersForEffect(category: GemCategory, effectId: string) {
    return GEMS.filter((g) => g.category === category && g.effectId === effectId).sort(
      (a, b) => a.tier - b.tier,
    );
  }

  function setRow(idx: number, gemId: string | null) {
    const next = [...gems];
    if (gemId === null) next[idx] = "";
    else next[idx] = gemId;
    // Trim trailing empties so storage stays tidy
    while (next.length && !next[next.length - 1]) next.pop();
    // Filter any in-between empties out for engine compatibility
    onChange(next.filter(Boolean));
  }

  function changeRowCategory(idx: number, category: GemCategory) {
    const effects = effectsForCategory(category);
    if (!effects.length) return;
    const tiers = tiersForEffect(category, effects[0].id);
    if (!tiers.length) return;
    setRow(idx, tiers[0].id);
  }
  function changeRowEffect(idx: number, category: GemCategory, effectId: string) {
    const tiers = tiersForEffect(category, effectId);
    if (!tiers.length) return;
    setRow(idx, tiers[0].id);
  }
  function changeRowTier(idx: number, gemId: string) {
    setRow(idx, gemId);
  }
  function addEmptyRow() {
    if (gems.length >= MAX_GEMS_PER_ITEM) return;
    // Default a freshly-added row to a t1 STR gem so it has shape
    onChange([...gems, "stat_strength_t1"]);
  }
  function removeRow(idx: number) {
    const next = gems.filter((_, i) => i !== idx);
    onChange(next);
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            Spellcraft
            {item && <span className="text-sm text-muted-foreground font-normal">— {item.name}</span>}
          </DialogTitle>
        </DialogHeader>

        {/* Status header */}
        <div className="flex items-center gap-3 p-3 rounded-md border border-border bg-muted/30">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Gems</span>
            <span className="font-display text-lg tabular-nums">
              {gems.length} / {MAX_GEMS_PER_ITEM}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Imbue</span>
            <span className={cn(
              "font-display text-lg tabular-nums",
              status.overcharge ? "text-status-waste" : status.imbueUsed === SAFE_IMBUE_LIMIT ? "text-status-capped" : "text-foreground",
            )}>
              {fmtPts(status.imbueUsed)} / {SAFE_IMBUE_LIMIT}
            </span>
          </div>
          {status.overcharge && (
            <div className="flex items-center gap-1.5 text-status-waste text-xs ml-auto">
              <AlertTriangle className="h-4 w-4" />
              Overcharge — risk of critical failure
            </div>
          )}
        </div>

        {/* Gem rows */}
        <div className="space-y-1.5">
          {Array.from({ length: MAX_GEMS_PER_ITEM }).map((_, idx) => {
            const gemId = gems[idx];
            const gem = gemId ? GEM_BY_ID[gemId] : undefined;
            const category = gem?.category ?? null;
            const effects = category ? effectsForCategory(category) : [];
            const tiers = category && gem ? tiersForEffect(category, gem.effectId) : [];
            const isEmpty = !gem;
            return (
              <div key={idx} className="grid grid-cols-[1fr_1.4fr_110px_auto] gap-2 items-center">
                <Select
                  value={category ?? ""}
                  onValueChange={(v) => changeRowCategory(idx, v as GemCategory)}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="—" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c.key} value={c.key} className="text-xs">{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={gem?.effectId ?? ""}
                  onValueChange={(v) => category && changeRowEffect(idx, category, v)}
                  disabled={!category}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="—" />
                  </SelectTrigger>
                  <SelectContent>
                    {effects.map((e) => (
                      <SelectItem key={e.id} value={e.id} className="text-xs">{e.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={gem?.id ?? ""}
                  onValueChange={(v) => changeRowTier(idx, v)}
                  disabled={!gem}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue placeholder="—" />
                  </SelectTrigger>
                  <SelectContent>
                    {tiers.map((g) => {
                      const over = status.imbueUsed - (gem?.cost ?? 0) + g.cost > SAFE_IMBUE_LIMIT;
                      return (
                        <SelectItem key={g.id} value={g.id} className="text-xs">
                          <span className="flex items-center gap-1.5">
                            <span>+{g.value}{g.category === "resist" || g.category === "power" ? "%" : ""}</span>
                            <span className="text-muted-foreground">· {g.quality}</span>
                            <span className={cn("text-muted-foreground", over && "text-status-waste")}>· {fmtPts(g.cost)}p</span>
                          </span>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>

                <button
                  onClick={() => !isEmpty && removeRow(idx)}
                  disabled={isEmpty}
                  className="h-9 w-9 inline-flex items-center justify-center rounded border border-border text-muted-foreground hover:text-destructive disabled:opacity-30"
                  aria-label="Remove gem"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}
          {gems.length < MAX_GEMS_PER_ITEM && (
            <div className="pt-1">
              <Badge variant="outline" className="text-[10px] cursor-pointer" onClick={addEmptyRow}>
                + add gem row
              </Badge>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-2">
          <Button onClick={onClose} variant="secondary" size="sm">Done</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
