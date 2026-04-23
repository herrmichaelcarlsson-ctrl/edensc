import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { itemAllowedForClass } from "@/lib/daoc/classes";
import type { DBItem, Realm, SlotKey } from "@/lib/daoc/types";
import { SLOT_BY_KEY } from "@/lib/daoc/slots";
import { Loader2 } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  slot: SlotKey | null;
  realm: Realm;
  className: string | null;
  onPick: (item: DBItem) => void;
}

export function ItemPickerDialog({ open, onClose, slot, realm, className, onPick }: Props) {
  const [search, setSearch] = useState("");
  const [items, setItems] = useState<DBItem[]>([]);
  const [loading, setLoading] = useState(false);

  const slotDef = slot ? SLOT_BY_KEY[slot] : null;

  useEffect(() => {
    if (!open || !slotDef) return;
    let cancelled = false;
    setLoading(true);
    (async () => {
      const { data, error } = await supabase
        .from("items")
        .select("*")
        .in("realm", [realm, "Any"])
        .in("slot", slotDef.dbSlots)
        .limit(2000);
      if (cancelled) return;
      if (error) {
        console.error(error);
        setItems([]);
      } else {
        setItems((data ?? []) as unknown as DBItem[]);
      }
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [open, slotDef, realm]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items
      .filter((i) => itemAllowedForClass(i.class_restriction, className))
      .filter((i) => !q || i.name.toLowerCase().includes(q))
      .sort((a, b) => (b.bonus_level ?? 0) - (a.bonus_level ?? 0))
      .slice(0, 300);
  }, [items, search, className]);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="font-display">
            Choose item — {slotDef?.label ?? ""}
          </DialogTitle>
          <DialogDescription>
            {realm}{className ? ` · ${className}` : ""} · {filtered.length} matches
          </DialogDescription>
        </DialogHeader>
        <Input
          autoFocus
          placeholder="Search by name…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <ScrollArea className="h-[60vh] rounded-md border border-border">
          {loading ? (
            <div className="flex items-center justify-center p-12 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading items…
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">No items match.</div>
          ) : (
            <ul className="divide-y divide-border">
              {filtered.map((it) => (
                <li
                  key={it.id}
                  className="flex items-start justify-between gap-4 p-3 hover:bg-accent/40 cursor-pointer transition-colors"
                  onClick={() => { onPick(it); onClose(); }}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium truncate">{it.name}</span>
                      {it.class_restriction && (
                        <Badge variant="outline" className="text-[10px]">{it.class_restriction}</Badge>
                      )}
                      {it.source_type && (
                        <Badge variant="secondary" className="text-[10px]">{it.source_type}</Badge>
                      )}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground flex flex-wrap gap-x-3 gap-y-1">
                      {it.armor_type && <span>{it.armor_type} · AF {it.armor_af}</span>}
                      {it.weapon_type && <span>{it.weapon_type} ({it.weapon_damage_type})</span>}
                      <span>QL {it.quality}</span>
                      <span>Bonus lvl {it.bonus_level ?? "?"}</span>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {(it.effects ?? []).slice(0, 6).map((e, i) => (
                        <span key={i} className="text-[10px] rounded px-1.5 py-0.5 bg-muted text-muted-foreground">
                          +{e.value} {e.id.replace(/_/g, " ")}
                        </span>
                      ))}
                      {(it.effects?.length ?? 0) > 6 && (
                        <span className="text-[10px] text-muted-foreground">+{it.effects!.length - 6} more</span>
                      )}
                    </div>
                  </div>
                  <Button size="sm" variant="default" className="shrink-0">Pick</Button>
                </li>
              ))}
            </ul>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}