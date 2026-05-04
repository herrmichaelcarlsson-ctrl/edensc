import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ArrowLeft, ArrowUpRight, Loader2, X } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { SLOTS, SLOT_BY_KEY } from "@/lib/daoc/slots";
import { EFFECT_OPTIONS, EFFECT_GROUPS } from "@/lib/daoc/effect-catalog";
import { loadState, saveState } from "@/lib/daoc/storage";
import type { DBItem, SlotKey } from "@/lib/daoc/types";

export const Route = createFileRoute("/items/browse")({
  head: () => ({
    meta: [
      { title: "Community Item Browser — Eden Template Forge" },
      { name: "description", content: "Browse community-submitted DAoC drops, artifacts and ToA items. Filter by realm, slot, class, and stats." },
    ],
  }),
  component: ItemsBrowsePage,
});

interface CommunityItem {
  id: string;
  name: string;
  realm: string;
  slot: string;
  class_restriction: string | null;
  origin: string | null;
  source_type: string | null;
  effects: { id: string; value: number }[];
  upvote_count: number;
}

function ItemsBrowsePage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [realm, setRealm] = useState<string>("Any");
  const [slot, setSlot] = useState<string>("Any");
  const [klass, setKlass] = useState<string>("Any");
  const [statFilters, setStatFilters] = useState<string[]>([]);
  const [items, setItems] = useState<CommunityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("community_items")
        .select("id,name,realm,slot,class_restriction,origin,source_type,effects,upvote_count")
        .eq("approved", true)
        .order("upvote_count", { ascending: false })
        .limit(1000);
      if (error) console.error(error);
      setItems((data ?? []) as unknown as CommunityItem[]);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((i) => {
      if (realm !== "Any" && i.realm !== realm) return false;
      if (slot !== "Any" && i.slot !== slot) return false;
      if (klass !== "Any" && i.class_restriction && i.class_restriction !== klass) return false;
      if (q && !i.name.toLowerCase().includes(q)) return false;
      if (statFilters.length) {
        const ids = new Set((i.effects ?? []).map((e) => e.id));
        if (!statFilters.every((f) => ids.has(f))) return false;
      }
      return true;
    });
  }, [items, realm, slot, klass, search, statFilters]);

  function toggleStat(id: string) {
    setStatFilters((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  }

  function useInBuild(it: CommunityItem) {
    const state = loadState();
    if (!state || !state.realm) {
      toast.error("Start a build on the home page first.");
      return;
    }
    if (state.realm !== it.realm) {
      toast.error(`Item is ${it.realm}, your build is ${state.realm}.`);
      return;
    }
    // Try to find a SLOTS entry that handles this dbSlot
    const slotEntry = SLOTS.find((s) => s.dbSlots.includes(it.slot));
    if (!slotEntry) {
      toast.error(`Unknown slot: ${it.slot}`);
      return;
    }
    const dbItem: DBItem = {
      id: `community:${it.id}`,
      external_id: null,
      name: it.name,
      realm: it.realm as DBItem["realm"],
      slot: it.slot,
      item_level: 51,
      bonus_level: 51,
      required_level: 50,
      quality: 100,
      level: 51,
      class_restriction: it.class_restriction,
      armor_type: null,
      armor_af: null,
      weapon_type: null,
      weapon_damage_type: null,
      weapon_dps: null,
      weapon_speed: null,
      origin: it.origin ?? "COMMUNITY",
      source_type: it.source_type ?? "COMMUNITY",
      online_url: null,
      effects: it.effects ?? [],
    };
    // Stash via sessionStorage so builder can pick it up.
    sessionStorage.setItem(
      "daoc:pending-item",
      JSON.stringify({ slotKey: slotEntry.key, item: dbItem }),
    );
    saveState({ ...state, slots: { ...state.slots, [slotEntry.key]: dbItem.id } });
    toast.success(`${it.name} → ${slotEntry.label}`);
    navigate({ to: "/builder" });
  }

  return (
    <div className="min-h-screen">
      <Toaster richColors position="bottom-right" />
      <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
        <div className="max-w-[1400px] mx-auto px-4 py-3 flex items-center gap-3">
          <Link to="/" className="text-muted-foreground hover:text-primary">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h1 className="font-display text-lg">Community Items</h1>
          <div className="flex-1" />
          <Link to="/items/submit" className="text-xs text-muted-foreground hover:text-primary">
            Submit an item →
          </Link>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-4 py-6 space-y-4">
        <Card className="p-4 bg-card/80 backdrop-blur space-y-3">
          <div className="grid md:grid-cols-[2fr_1fr_1fr_1fr] gap-2">
            <Input placeholder="Search by name…" value={search} onChange={(e) => setSearch(e.target.value)} className="h-9" />
            <Select value={realm} onValueChange={setRealm}>
              <SelectTrigger className="h-9 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Any">All realms</SelectItem>
                <SelectItem value="Albion">Albion</SelectItem>
                <SelectItem value="Hibernia">Hibernia</SelectItem>
                <SelectItem value="Midgard">Midgard</SelectItem>
              </SelectContent>
            </Select>
            <Select value={slot} onValueChange={setSlot}>
              <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Slot" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Any">All slots</SelectItem>
                {SLOTS.map((s) => s.dbSlots.map((db) => (
                  <SelectItem key={`${s.key}:${db}`} value={db}>{s.label} — {db}</SelectItem>
                )))}
              </SelectContent>
            </Select>
            <Input placeholder="Class restriction…" value={klass === "Any" ? "" : klass}
              onChange={(e) => setKlass(e.target.value || "Any")} className="h-9" />
          </div>

          <div className="flex items-center flex-wrap gap-1.5">
            <Popover>
              <PopoverTrigger asChild>
                <Button size="sm" variant="outline" className="h-7 text-xs">+ Filter by stat</Button>
              </PopoverTrigger>
              <PopoverContent className="w-72 p-0 max-h-80 overflow-auto">
                {EFFECT_GROUPS.map((g) => {
                  const opts = EFFECT_OPTIONS.filter((o) => o.group === g);
                  return (
                    <div key={g} className="border-b border-border last:border-0">
                      <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-muted-foreground bg-muted/40">{g}</div>
                      <div className="flex flex-wrap gap-1 p-2">
                        {opts.map((o) => {
                          const active = statFilters.includes(o.id);
                          return (
                            <button key={o.id} onClick={() => toggleStat(o.id)}
                              className={`text-[11px] px-2 py-0.5 rounded border ${active ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/50"}`}>
                              {o.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </PopoverContent>
            </Popover>
            {statFilters.map((id) => {
              const opt = EFFECT_OPTIONS.find((o) => o.id === id);
              return (
                <Badge key={id} variant="secondary" className="text-[10px] gap-1 pr-1">
                  {opt?.label ?? id}
                  <button onClick={() => toggleStat(id)} className="hover:text-destructive">
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              );
            })}
            {statFilters.length > 0 && (
              <Button size="sm" variant="ghost" className="h-6 text-[10px]" onClick={() => setStatFilters([])}>Clear</Button>
            )}
          </div>
        </Card>

        <Card className="bg-card/80 backdrop-blur p-0 overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin inline mr-2" />Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">No items match your filters.</div>
          ) : (
            <ul className="divide-y divide-border">
              {filtered.slice(0, 200).map((it) => {
                const slotEntry = SLOTS.find((s) => s.dbSlots.includes(it.slot));
                return (
                  <li key={it.id} className="p-3 flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium">{it.name}</span>
                        <Badge variant="outline" className="text-[10px]">{it.realm}</Badge>
                        <Badge variant="secondary" className="text-[10px]">{slotEntry?.label ?? it.slot}</Badge>
                        {it.origin && <Badge variant="outline" className="text-[10px]">{it.origin}</Badge>}
                        {it.class_restriction && <Badge variant="outline" className="text-[10px]">{it.class_restriction}</Badge>}
                        <span className="text-[10px] text-muted-foreground">▲ {it.upvote_count}</span>
                      </div>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {(it.effects ?? []).map((e, i) => (
                          <span key={i} className="text-[10px] rounded px-1.5 py-0.5 bg-muted text-muted-foreground">
                            +{e.value} {e.id.replace(/_/g, " ")}
                          </span>
                        ))}
                      </div>
                    </div>
                    <Button size="sm" variant="default" onClick={() => useInBuild(it)} className="shrink-0">
                      Use in build <ArrowUpRight className="h-3 w-3 ml-1" />
                    </Button>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </main>
    </div>
  );
}

// Suppress unused warning for SLOT_BY_KEY (kept for consistency / future).
void SLOT_BY_KEY;