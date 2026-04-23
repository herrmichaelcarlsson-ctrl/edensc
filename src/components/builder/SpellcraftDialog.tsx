import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
import type { DBItem, SlotKey } from "@/lib/daoc/types";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onClose: () => void;
  slot: SlotKey | null;
  item: DBItem | undefined;
  gems: GemSet;
  onChange: (gems: GemSet) => void;
}

const CATEGORIES: { key: GemCategory; label: string }[] = [
  { key: "stat", label: "Stats" },
  { key: "resist", label: "Resists" },
  { key: "cap", label: "Stat Caps" },
  { key: "hp", label: "Hit Points" },
  { key: "power", label: "Power" },
];

export function SpellcraftDialog({ open, onClose, slot, item, gems, onChange }: Props) {
  const [category, setCategory] = useState<GemCategory>("stat");

  const status = useMemo(() => inspectGems(gems), [gems]);
  const filtered = useMemo(
    () => GEMS.filter((g) => g.category === category).sort((a, b) => a.label.localeCompare(b.label) || a.tier - b.tier),
    [category],
  );

  function addGem(gemId: string) {
    if (gems.length >= MAX_GEMS_PER_ITEM) return;
    onChange([...gems, gemId]);
  }
  function removeGem(idx: number) {
    onChange(gems.filter((_, i) => i !== idx));
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl">
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
              {status.imbueUsed} / {SAFE_IMBUE_LIMIT}
            </span>
          </div>
          {status.overcharge && (
            <div className="flex items-center gap-1.5 text-status-waste text-xs ml-auto">
              <AlertTriangle className="h-4 w-4" />
              Overcharge — riskerar att misslyckas
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
                      <span className="truncate">{g.label}</span>
                      <span className="flex items-center gap-1.5">
                        <Badge variant="outline" className="text-[9px] py-0">{g.cost}p</Badge>
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

        {/* Gem catalog */}
        <Tabs value={category} onValueChange={(v) => setCategory(v as GemCategory)}>
          <TabsList className="w-full">
            {CATEGORIES.map((c) => (
              <TabsTrigger key={c.key} value={c.key} className="flex-1 text-xs">{c.label}</TabsTrigger>
            ))}
          </TabsList>
          {CATEGORIES.map((c) => (
            <TabsContent key={c.key} value={c.key} className="mt-2">
              <ScrollArea className="h-[280px] pr-3">
                <div className="grid grid-cols-2 gap-1">
                  {filtered.map((g) => {
                    const wouldOver = status.imbueUsed + g.cost > SAFE_IMBUE_LIMIT;
                    const noSlot = status.remaining === 0;
                    return (
                      <button
                        key={g.id}
                        disabled={noSlot}
                        onClick={() => addGem(g.id)}
                        className={cn(
                          "text-left text-xs px-2 py-1.5 rounded border border-border hover:border-primary/50 transition-colors flex items-center justify-between",
                          noSlot && "opacity-40 cursor-not-allowed",
                          wouldOver && !noSlot && "border-status-waste/40",
                        )}
                      >
                        <span className="truncate">{g.label}</span>
                        <span className="flex items-center gap-1.5 ml-2 shrink-0">
                          <Badge variant="outline" className="text-[9px] py-0">{g.cost}p</Badge>
                          <Plus className="h-3 w-3 text-muted-foreground" />
                        </span>
                      </button>
                    );
                  })}
                </div>
              </ScrollArea>
            </TabsContent>
          ))}
        </Tabs>

        <div className="flex justify-end pt-2">
          <Button onClick={onClose} variant="secondary" size="sm">Done</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
