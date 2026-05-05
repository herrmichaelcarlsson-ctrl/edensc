import { Badge } from "@/components/ui/badge";
import { X, Plus, Gem } from "lucide-react";
import type { DBItem, SlotKey } from "@/lib/daoc/types";
import { SLOT_BY_KEY } from "@/lib/daoc/slots";
import { isCraftable, inspectGems, gemsToEffects, MAX_GEMS_PER_ITEM, type GemSet } from "@/lib/daoc/spellcraft";
import { effectById } from "@/lib/daoc/effect-catalog";
import { cn } from "@/lib/utils";

interface Props {
  slotKey: SlotKey;
  item?: DBItem;
  gems?: GemSet;
  onPick: () => void;
  onClear: () => void;
  onSpellcraft?: () => void;
}

export function SlotCard({ slotKey, item, gems = [], onPick, onClear, onSpellcraft }: Props) {
  const def = SLOT_BY_KEY[slotKey];
  const craftable = isCraftable(item);
  const status = inspectGems(gems);

  // Combined effects: item base + spellcraft gems.
  const combined: { id: string; value: number }[] = (() => {
    const map = new Map<string, number>();
    for (const e of item?.effects ?? []) map.set(e.id, (map.get(e.id) ?? 0) + e.value);
    for (const e of gemsToEffects(gems)) map.set(e.id, (map.get(e.id) ?? 0) + e.value);
    return Array.from(map, ([id, value]) => ({ id, value }));
  })();

  const isCraftedShell = !!item && (item.origin === "CRAFTED" || item.source_type === "CRAFTED")
    && (item.effects ?? []).length === 0;
  const displayName = isCraftedShell && combined.length > 0
    ? `Crafted ${def.label} (${combined.length} gem${combined.length > 1 ? "s" : ""})`
    : item?.name ?? "";

  function fmtEffect(id: string, value: number) {
    const opt = effectById(id);
    const label = opt?.label ?? id.replace(/_/g, " ");
    const suffix = opt?.suffix ?? "";
    return `+${value}${suffix} ${label}`;
  }

  return (
    <div className="rounded-md border border-border bg-card/60 backdrop-blur-sm hover:border-primary/40 transition-colors">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/60">
        <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
          {def.label}
        </span>
        <div className="flex items-center gap-1.5">
          {item && craftable && onSpellcraft && (
            <button
              onClick={onSpellcraft}
              className={cn(
                "flex items-center gap-1 text-[10px] tabular-nums px-1.5 py-0.5 rounded transition-colors",
                status.used > 0 ? "text-primary hover:bg-primary/10" : "text-muted-foreground hover:text-primary",
                status.overcharge && "text-status-waste",
              )}
              aria-label="Spellcraft"
              title="Spellcraft this item"
            >
              <Gem className="h-3 w-3" />
              {status.used}/{MAX_GEMS_PER_ITEM}
            </button>
          )}
          {item && (
            <button
              onClick={onClear}
              className="text-muted-foreground hover:text-destructive transition-colors"
              aria-label="Clear slot"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
      <button
        onClick={onPick}
        className="w-full text-left px-3 py-2 min-h-[64px] flex flex-col gap-1 group"
      >
        {item ? (
          <>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium leading-tight line-clamp-2">{displayName}</span>
            </div>
            {combined.length > 0 && (
              <div className="flex flex-wrap gap-x-2 gap-y-0.5 mt-0.5">
                {combined.map((e, i) => (
                  <span
                    key={i}
                    className="text-[10px] text-foreground/80 tabular-nums"
                    title={fmtEffect(e.id, e.value)}
                  >
                    {fmtEffect(e.id, e.value)}
                  </span>
                ))}
              </div>
            )}
            {item.class_restriction && (
              <Badge variant="outline" className="self-start mt-0.5 text-[9px]">
                {item.class_restriction}
              </Badge>
            )}
          </>
        ) : (
          <div className="flex items-center gap-2 text-muted-foreground group-hover:text-primary transition-colors">
            <Plus className="h-4 w-4" />
            <span className="text-sm">Empty</span>
          </div>
        )}
      </button>
    </div>
  );
}