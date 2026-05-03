import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Plus, AlertTriangle } from "lucide-react";
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
  { key: "resist", label: "Resists" },
  { key: "hp", label: "Hit Points" },
  { key: "power", label: "Power" },
  { key: "skill", label: "Skills" },
];

export function SpellcraftDialog({ open, onClose, slot, item, gems, onChange, realm }: Props) {
  const [category, setCategory] = useState<GemCategory>("stat");
  const [effectId, setEffectId] = useState<string>("");
  const [gemId, setGemId] = useState<string>("");

  const status = useMemo(() => inspectGems(gems), [gems]);

  // Group gems in current category by effectId (the "stat" choice)
  const effectsForCategory = useMemo(() => {
    const map = new Map<string, { id: string; label: string }>();
    for (const g of GEMS) {
      if (g.category !== category) continue;
      if (g.category === "skill" && realm && g.realm !== realm) continue;
      if (!map.has(g.effectId)) {
        // Strip the value/sign from gem label to get the bare stat name
        const label = g.label.replace(/^\+\d+%?\s*/, "").trim();
        map.set(g.effectId, { id: g.effectId, label });
      }
    }
    return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label));
  }, [category, realm]);

  const tiersForEffect = useMemo(() => {
    if (!effectId) return [];
    return GEMS.filter((g) => g.category === category && g.effectId === effectId).sort(
      (a, b) => a.tier - b.tier,
    );
  }, [category, effectId]);

  // Reset selections when category changes
  function changeCategory(c: GemCategory) {
    setCategory(c);
    setEffectId("");
    setGemId("");
  }
  function changeEffect(id: string) {
    setEffectId(id);
    setGemId("");
  }

  function addGem(gemId: string) {
    if (gems.length >= MAX_GEMS_PER_ITEM) return;
    onChange([...gems, gemId]);
  }
  function removeGem(idx: number) {
    onChange(gems.filter((_, i) => i !== idx));
  }

  function confirmAdd() {
    if (!gemId) return;
    addGem(gemId);
    setGemId("");
  }

  const selectedGem = gemId ? GEM_BY_ID[gemId] : undefined;
  const wouldOver = selectedGem ? status.imbueUsed + selectedGem.cost > SAFE_IMBUE_LIMIT : false;
  const noSlot = status.remaining === 0;

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
              {status.used} / {MAX_GEMS_PER_ITEM}
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

        {/* Current gems */}
        <div className="space-y-1.5">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Slots</div>
          <div className="grid grid-cols-2 gap-1.5">
            {Array.from({ length: MAX_GEMS_PER_ITEM }).map((_, i) => {
              const g = gems[i] ? GEM_BY_ID[gems[i]] : undefined;
              return (
                <div key={i} className={cn(
                  "rounded border px-2 py-1.5 text-xs flex items-center justify-between min-h-[36px]",
                  g ? "border-primary/40 bg-primary/5" : "border-dashed border-border bg-muted/20 text-muted-foreground",
                )}>
                  {g ? (
                    <>
                      <span className="truncate" title={g.gemName}>
                        <span className="text-muted-foreground">{g.quality}</span>{" "}
                        {g.label}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Badge variant="outline" className="text-[9px] py-0">{fmtPts(g.cost)}p</Badge>
                        <button onClick={() => removeGem(i)} className="text-muted-foreground hover:text-destructive">
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    </>
                  ) : (
                    <span>Slot {i + 1} — empty</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Gem builder — dropdown style */}
        <div className="space-y-2 rounded-md border border-border bg-muted/20 p-3">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Add gem</div>

          {/* Category */}
          <div className="grid grid-cols-5 gap-1">
            {CATEGORIES.map((c) => (
              <button
                key={c.key}
                onClick={() => changeCategory(c.key)}
                className={cn(
                  "text-[11px] py-1 rounded border transition-colors",
                  category === c.key
                    ? "border-primary/60 bg-primary/10 text-foreground"
                    : "border-border bg-card/40 text-muted-foreground hover:text-foreground",
                )}
              >
                {c.label}
              </button>
            ))}
          </div>

          {/* Stat + value selectors */}
          <div className="grid grid-cols-[1fr_1fr_auto] gap-2 items-end pt-1">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                {category === "resist" ? "Resist" : category === "skill" ? "Skill" : category === "hp" || category === "power" ? "Type" : "Stat"}
              </label>
              <Select value={effectId} onValueChange={changeEffect}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Select…" />
                </SelectTrigger>
                <SelectContent>
                  {effectsForCategory.map((e) => (
                    <SelectItem key={e.id} value={e.id} className="text-xs">
                      {e.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Gem</label>
              <Select value={gemId} onValueChange={setGemId} disabled={!effectId}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder={effectId ? "Select quality…" : "Pick a stat first"} />
                </SelectTrigger>
                <SelectContent>
                  {tiersForEffect.map((g) => {
                    const over = status.imbueUsed + g.cost > SAFE_IMBUE_LIMIT;
                    return (
                      <SelectItem key={g.id} value={g.id} className="text-xs">
                        <span className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium">{g.quality}</span>
                          <span>+{g.value}{category === "resist" || category === "power" ? "%" : ""}</span>
                          <span className="text-muted-foreground">·</span>
                          <span className={cn("text-muted-foreground", over && "text-status-waste")}>
                            {fmtPts(g.cost)}p imbue
                          </span>
                        </span>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <Button
              size="sm"
              onClick={confirmAdd}
              disabled={!gemId || noSlot}
              className="h-9"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />
              Add
            </Button>
          </div>

          {selectedGem && (
            <div className="flex items-center gap-2 text-[11px] pt-1 flex-wrap">
              <Badge variant="outline" className="text-[10px]">{selectedGem.gemName}</Badge>
              <span className="text-muted-foreground">→ {selectedGem.label}</span>
              <span className={cn("text-muted-foreground", wouldOver && "text-status-waste")}>
                · {fmtPts(selectedGem.cost)}p imbue · total {fmtPts(status.imbueUsed + selectedGem.cost)}/{SAFE_IMBUE_LIMIT}
                {wouldOver && " — overcharge"}
              </span>
            </div>
          )}
          {noSlot && (
            <div className="text-[11px] text-status-waste flex items-center gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5" />
              All 4 gem slots are full
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
