import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Plus } from "lucide-react";
import type { DBItem, SlotKey } from "@/lib/daoc/types";
import { SLOT_BY_KEY } from "@/lib/daoc/slots";

interface Props {
  slotKey: SlotKey;
  item?: DBItem;
  onPick: () => void;
  onClear: () => void;
}

export function SlotCard({ slotKey, item, onPick, onClear }: Props) {
  const def = SLOT_BY_KEY[slotKey];
  return (
    <div className="rounded-md border border-border bg-card/60 backdrop-blur-sm hover:border-primary/40 transition-colors">
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/60">
        <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
          {def.label}
        </span>
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
      <button
        onClick={onPick}
        className="w-full text-left px-3 py-2 min-h-[64px] flex flex-col gap-1 group"
      >
        {item ? (
          <>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium leading-tight line-clamp-2">{item.name}</span>
            </div>
            <div className="flex flex-wrap gap-1 mt-0.5">
              {(item.effects ?? []).slice(0, 4).map((e, i) => (
                <span key={i} className="text-[9px] text-muted-foreground">
                  +{e.value} {e.id.replace(/_/g, " ").slice(0, 12)}
                </span>
              ))}
            </div>
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