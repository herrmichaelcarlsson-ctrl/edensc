import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, X } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { aggregate, type AggregateResult } from "@/lib/daoc/aggregate";
import { calcGearScore, calcImbueUsed } from "@/lib/daoc/formulas";
import type { DBItem, SlotKey, TemplateSlots } from "@/lib/daoc/types";
import { GEM_BY_ID, type SpellcraftMap } from "@/lib/daoc/spellcraft";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/compare")({
  head: () => ({
    meta: [
      { title: "Compare Templates — Eden Template Forge" },
      { name: "description", content: "Compare 2–3 DAoC templates side by side: stats, resists, GearScore, imbue and waste." },
    ],
  }),
  component: ComparePage,
});

interface TemplateRow {
  id: string;
  name: string;
  realm: string;
  class_name: string | null;
  slots: TemplateSlots;
  spellcraft: SpellcraftMap;
}

const MAX_COLS = 3;

function ComparePage() {
  const [available, setAvailable] = useState<TemplateRow[]>([]);
  const [chosenIds, setChosenIds] = useState<(string | null)[]>([null, null, null]);
  const [templates, setTemplates] = useState<Record<string, TemplateRow>>({});
  const [items, setItems] = useState<Record<string, DBItem>>({});

  // Load list of public templates
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("saved_templates")
        .select("id, name, realm, class_name, slots, spellcraft")
        .eq("is_public", true)
        .order("vote_count", { ascending: false })
        .limit(200);
      setAvailable((data ?? []) as unknown as TemplateRow[]);
    })();
  }, []);

  // Resolve chosen templates + items
  useEffect(() => {
    const ids = chosenIds.filter((x): x is string => !!x && !templates[x]);
    if (!ids.length) return;
    (async () => {
      const { data } = await supabase
        .from("saved_templates")
        .select("id, name, realm, class_name, slots, spellcraft")
        .in("id", ids);
      const map = { ...templates };
      for (const t of (data ?? []) as unknown as TemplateRow[]) map[t.id] = t;
      setTemplates(map);
    })();
  }, [chosenIds, templates]);

  // Resolve item ids
  useEffect(() => {
    const need = new Set<string>();
    for (const id of chosenIds) {
      if (!id) continue;
      const t = templates[id];
      if (!t) continue;
      for (const sid of Object.values(t.slots)) {
        if (sid && !sid.startsWith("custom:") && !sid.startsWith("crafted:") && !items[sid]) need.add(sid);
      }
    }
    if (!need.size) return;
    (async () => {
      const { data } = await supabase.from("items").select("*").in("id", Array.from(need));
      const map = { ...items };
      for (const it of (data ?? []) as unknown as DBItem[]) map[it.id] = it;
      setItems(map);
    })();
  }, [chosenIds, templates, items]);

  const cols = useMemo(() => {
    return chosenIds.map((id) => {
      if (!id) return null;
      const t = templates[id];
      if (!t) return null;
      const itemsBySlot: Partial<Record<SlotKey, DBItem | undefined>> = {};
      for (const [k, sid] of Object.entries(t.slots) as [SlotKey, string | undefined][]) {
        if (sid) itemsBySlot[k] = items[sid];
      }
      const agg = aggregate(itemsBySlot, t.spellcraft);
      const score = calcGearScore(agg);
      // Total imbue used = sum across slots of formula imbue (highest+rest/2)
      let totalImbue = 0;
      for (const sid of Object.keys(t.spellcraft)) {
        const gemIds = t.spellcraft[sid as SlotKey] ?? [];
        const costs = gemIds.map((g) => GEM_BY_ID[g]?.cost ?? 0);
        totalImbue += calcImbueUsed(costs);
      }
      return { template: t, agg, score, totalImbue };
    });
  }, [chosenIds, templates, items]);

  return (
    <div className="min-h-screen">
      <Toaster richColors position="bottom-right" />
      <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
        <div className="max-w-[1400px] mx-auto px-4 py-3 flex items-center gap-3">
          <Link to="/builder" className="text-muted-foreground hover:text-primary">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h1 className="font-display text-lg">Compare Templates</h1>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-4 py-6">
        <div className={`grid gap-4 mb-6`} style={{ gridTemplateColumns: `repeat(${MAX_COLS}, minmax(0, 1fr))` }}>
          {chosenIds.map((id, i) => (
            <Card key={i} className="p-3 bg-card/80 backdrop-blur">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Slot {i + 1}</span>
                {id && (
                  <button
                    className="ml-auto text-muted-foreground hover:text-destructive"
                    onClick={() => setChosenIds((prev) => prev.map((x, idx) => (idx === i ? null : x)))}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <Select
                value={id ?? ""}
                onValueChange={(v) => setChosenIds((prev) => prev.map((x, idx) => (idx === i ? v : x)))}
              >
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Pick a public template…" />
                </SelectTrigger>
                <SelectContent>
                  {available.map((t) => (
                    <SelectItem key={t.id} value={t.id} className="text-xs">
                      {t.name} <span className="text-muted-foreground">· {t.realm}{t.class_name ? ` · ${t.class_name}` : ""}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Card>
          ))}
        </div>

        {/* Diff table */}
        {cols.some(Boolean) ? (
          <Card className="bg-card/80 backdrop-blur p-0 overflow-hidden">
            <DiffTable cols={cols} />
          </Card>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-12">
            Pick at least one published template above to begin.
          </p>
        )}
      </main>
    </div>
  );
}

type Col = { template: TemplateRow; agg: AggregateResult; score: ReturnType<typeof calcGearScore>; totalImbue: number } | null;

function DiffTable({ cols }: { cols: Col[] }) {
  // Decide best-of vs worst-of (higher = better, except waste/imbue)
  function bestWorst(values: (number | null)[], higherBetter: boolean) {
    const nums = values.filter((v): v is number => v != null);
    if (nums.length < 2) return { best: null as number | null, worst: null as number | null };
    return {
      best: higherBetter ? Math.max(...nums) : Math.min(...nums),
      worst: higherBetter ? Math.min(...nums) : Math.max(...nums),
    };
  }

  function cellClass(value: number | null, b: number | null, w: number | null) {
    if (value == null || b == null) return "text-foreground/80";
    if (value === b && b !== w) return "text-status-capped font-semibold";
    if (value === w) return "text-status-missing";
    return "text-foreground/80";
  }

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <>
      <tr className="bg-muted/40">
        <td colSpan={cols.length + 1} className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-muted-foreground font-display">
          {title}
        </td>
      </tr>
      {children}
    </>
  );

  function Row({ label, values, higherBetter = true, suffix = "" }: { label: string; values: (number | null)[]; higherBetter?: boolean; suffix?: string }) {
    const { best, worst } = bestWorst(values, higherBetter);
    return (
      <tr className="border-t border-border/40">
        <td className="px-3 py-1.5 text-xs text-foreground/90">{label}</td>
        {values.map((v, i) => (
          <td key={i} className={cn("px-3 py-1.5 text-xs tabular-nums text-right", cellClass(v, best, worst))}>
            {v == null ? "—" : `${v}${suffix}`}
          </td>
        ))}
      </tr>
    );
  }

  // Stat keys to compare
  const statKeys = cols.find((c) => c)?.agg.stats.filter((s) => s.group === "stat").map((s) => s.key) ?? [];
  const resistKeys = cols.find((c) => c)?.agg.stats.filter((s) => s.group === "resist").map((s) => s.key) ?? [];

  function statValue(c: Col, key: string): number | null {
    if (!c) return null;
    return c.agg.stats.find((s) => s.key === key)?.current ?? 0;
  }

  return (
    <table className="w-full">
      <thead>
        <tr>
          <th className="px-3 py-2 text-left text-[11px] text-muted-foreground font-medium">Metric</th>
          {cols.map((c, i) => (
            <th key={i} className="px-3 py-2 text-right text-[11px]">
              {c ? (
                <div className="flex flex-col items-end">
                  <span className="font-display">{c.template.name}</span>
                  <Badge variant="outline" className="text-[9px] mt-0.5">{c.template.realm}{c.template.class_name ? ` · ${c.template.class_name}` : ""}</Badge>
                </div>
              ) : (
                <span className="text-muted-foreground italic">—</span>
              )}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        <Section title="Gear Score">
          <Row label="Utility" values={cols.map((c) => c?.score.utility ?? null)} />
          <Row label="ToA" values={cols.map((c) => c?.score.toa ?? null)} />
          <Row label="Charges" values={cols.map((c) => c?.score.charge ?? null)} />
          <Row label="Waste" values={cols.map((c) => c?.score.waste ?? null)} higherBetter={false} />
          <Row label="Total" values={cols.map((c) => c?.score.total ?? null)} />
          <Row label="Total Imbue Used" values={cols.map((c) => c?.totalImbue ?? null)} higherBetter={false} />
        </Section>
        <Section title="Stats">
          {statKeys.map((k) => (
            <Row key={k} label={cols.find((c) => c)?.agg.stats.find((s) => s.key === k)?.label ?? k} values={cols.map((c) => statValue(c, k))} />
          ))}
        </Section>
        <Section title="Resists">
          {resistKeys.map((k) => (
            <Row key={k} label={cols.find((c) => c)?.agg.stats.find((s) => s.key === k)?.label ?? k} values={cols.map((c) => statValue(c, k))} suffix="%" />
          ))}
        </Section>
      </tbody>
    </table>
  );
}