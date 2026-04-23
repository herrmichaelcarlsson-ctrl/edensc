import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ItemPickerDialog } from "@/components/builder/ItemPickerDialog";
import { SlotCard } from "@/components/builder/SlotCard";
import { StatsPanel } from "@/components/builder/StatsPanel";
import { SpellcraftDialog } from "@/components/builder/SpellcraftDialog";
import { SuggestionsPanel } from "@/components/builder/SuggestionsPanel";
import { SLOTS } from "@/lib/daoc/slots";
import type { DBItem, Realm, SlotKey, TemplateSlots } from "@/lib/daoc/types";
import { aggregate } from "@/lib/daoc/aggregate";
import { isCraftable, inspectGems, type SpellcraftMap } from "@/lib/daoc/spellcraft";
import { suggestGems } from "@/lib/daoc/suggest";
import { loadState, saveState } from "@/lib/daoc/storage";
import { exportTemplateText } from "@/lib/daoc/export";
import { ArrowLeft, Copy, Save, Trash2, Download, Upload } from "lucide-react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

export const Route = createFileRoute("/builder")({
  head: () => ({
    meta: [
      { title: "Template Builder — Eden Template Forge" },
      { name: "description", content: "Build and optimize a DAoC character template with live stat caps." },
    ],
  }),
  component: BuilderPage,
});

function BuilderPage() {
  const navigate = useNavigate();
  const [realm, setRealm] = useState<Realm | null>(null);
  const [className, setClassName] = useState<string | null>(null);
  const [templateName, setTemplateName] = useState("Untitled Template");
  const [slots, setSlots] = useState<TemplateSlots>({});
  const [pickerSlot, setPickerSlot] = useState<SlotKey | null>(null);
  const [spellcraftSlot, setSpellcraftSlot] = useState<SlotKey | null>(null);
  const [spellcraft, setSpellcraft] = useState<SpellcraftMap>({});
  const [itemsCache, setItemsCache] = useState<Record<string, DBItem>>({});

  // Initial load from localStorage
  useEffect(() => {
    const s = loadState();
    if (!s || !s.realm) {
      navigate({ to: "/" });
      return;
    }
    setRealm(s.realm);
    setClassName(s.className);
    setSlots(s.slots ?? {});
    setTemplateName(s.templateName ?? "Untitled Template");
    setSpellcraft(s.spellcraft ?? {});
  }, [navigate]);

  // Resolve item ids in slots → fetch any missing
  useEffect(() => {
    const ids = Object.values(slots).filter((id): id is string => !!id);
    const missing = ids.filter((id) => !itemsCache[id]);
    if (missing.length === 0) return;
    (async () => {
      const { data, error } = await supabase
        .from("items")
        .select("*")
        .in("id", missing);
      if (error) {
        console.error(error);
        return;
      }
      const next = { ...itemsCache };
      for (const it of (data ?? []) as unknown as DBItem[]) next[it.id] = it;
      setItemsCache(next);
    })();
  }, [slots, itemsCache]);

  // Persist
  useEffect(() => {
    if (!realm) return;
    saveState({ realm, className, slots, templateName, spellcraft });
  }, [realm, className, slots, templateName, spellcraft]);

  const itemsBySlot = useMemo(() => {
    const map: Partial<Record<SlotKey, DBItem | undefined>> = {};
    for (const k of Object.keys(slots) as SlotKey[]) {
      const id = slots[k];
      if (id) map[k] = itemsCache[id];
    }
    return map;
  }, [slots, itemsCache]);

  const agg = useMemo(() => aggregate(itemsBySlot, spellcraft), [itemsBySlot, spellcraft]);
  const suggestions = useMemo(() => suggestGems(agg), [agg]);

  const gemTotals = useMemo(() => {
    let used = 0;
    let slotsAvail = 0;
    for (const k of Object.keys(itemsBySlot) as SlotKey[]) {
      if (isCraftable(itemsBySlot[k])) {
        slotsAvail += 4;
        used += inspectGems(spellcraft[k]).used;
      }
    }
    return { used, slotsAvail };
  }, [itemsBySlot, spellcraft]);

  function pickItem(item: DBItem) {
    if (!pickerSlot) return;
    setItemsCache((c) => ({ ...c, [item.id]: item }));
    setSlots((s) => ({ ...s, [pickerSlot]: item.id }));
  }

  function clearSlot(key: SlotKey) {
    setSlots((s) => {
      const n = { ...s };
      delete n[key];
      return n;
    });
    setSpellcraft((sc) => {
      const n = { ...sc };
      delete n[key];
      return n;
    });
  }

  function clearAll() {
    if (!confirm("Clear all slots?")) return;
    setSlots({});
    setSpellcraft({});
    toast.success("Template cleared");
  }

  async function saveToCloud() {
    if (!realm) return;
    const { error } = await supabase.from("saved_templates").insert({
      name: templateName,
      realm,
      class_name: className,
      slots: slots as never,
    });
    if (error) toast.error("Save failed: " + error.message);
    else toast.success("Saved to cloud");
  }

  function exportText() {
    if (!realm) return;
    const text = exportTemplateText(templateName, realm, className, itemsBySlot, agg);
    navigator.clipboard.writeText(text);
    toast.success("Template copied to clipboard");
  }

  function exportJson() {
    const blob = new Blob([JSON.stringify({ name: templateName, realm, className, slots }, null, 2)],
      { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${templateName.replace(/[^a-z0-9]+/gi, "_")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function importJson(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const obj = JSON.parse(reader.result as string);
        if (obj.realm) setRealm(obj.realm);
        if (obj.className !== undefined) setClassName(obj.className);
        if (obj.slots) setSlots(obj.slots);
        if (obj.name) setTemplateName(obj.name);
        toast.success("Template imported");
      } catch {
        toast.error("Invalid JSON");
      }
    };
    reader.readAsText(f);
    e.target.value = "";
  }

  if (!realm) return null;

  const armorSlots = SLOTS.filter((s) => s.group === "armor");
  const weaponSlots = SLOTS.filter((s) => s.group === "weapon");
  const jewelrySlots = SLOTS.filter((s) => s.group === "jewelry");

  return (
    <div className="min-h-screen">
      <Toaster richColors position="bottom-right" />

      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
        <div className="max-w-[1400px] mx-auto px-4 py-3 flex items-center gap-3 flex-wrap">
          <Link to="/" className="text-muted-foreground hover:text-primary">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <Input
            value={templateName}
            onChange={(e) => setTemplateName(e.target.value)}
            className="h-8 max-w-xs font-display text-base"
          />
          <Badge variant="outline" className="font-medium">{realm}</Badge>
          {className && <Badge variant="secondary">{className}</Badge>}
          <div className="flex-1" />
          <Button size="sm" variant="ghost" onClick={exportText}>
            <Copy className="h-4 w-4 mr-1.5" /> Copy
          </Button>
          <Button size="sm" variant="ghost" onClick={exportJson}>
            <Download className="h-4 w-4 mr-1.5" /> JSON
          </Button>
          <label className="inline-flex items-center text-sm cursor-pointer text-muted-foreground hover:text-foreground px-2 py-1.5 rounded">
            <Upload className="h-4 w-4 mr-1.5" /> Import
            <input type="file" accept="application/json" onChange={importJson} className="hidden" />
          </label>
          <Button size="sm" variant="ghost" onClick={clearAll}>
            <Trash2 className="h-4 w-4 mr-1.5" /> Clear
          </Button>
          <Button size="sm" onClick={saveToCloud}>
            <Save className="h-4 w-4 mr-1.5" /> Save
          </Button>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-4 py-6 grid lg:grid-cols-[1fr_360px] gap-6">
        {/* Slots */}
        <div className="space-y-6">
          <Section title="Armor">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {armorSlots.map((s) => (
                <SlotCard
                  key={s.key}
                  slotKey={s.key}
                  item={itemsBySlot[s.key]}
                  gems={spellcraft[s.key]}
                  onPick={() => setPickerSlot(s.key)}
                  onClear={() => clearSlot(s.key)}
                  onSpellcraft={() => setSpellcraftSlot(s.key)}
                />
              ))}
            </div>
          </Section>

          <Section title="Weapons">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {weaponSlots.map((s) => (
                <SlotCard
                  key={s.key}
                  slotKey={s.key}
                  item={itemsBySlot[s.key]}
                  gems={spellcraft[s.key]}
                  onPick={() => setPickerSlot(s.key)}
                  onClear={() => clearSlot(s.key)}
                  onSpellcraft={() => setSpellcraftSlot(s.key)}
                />
              ))}
            </div>
          </Section>

          <Section title="Jewelry">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {jewelrySlots.map((s) => (
                <SlotCard
                  key={s.key}
                  slotKey={s.key}
                  item={itemsBySlot[s.key]}
                  gems={spellcraft[s.key]}
                  onPick={() => setPickerSlot(s.key)}
                  onClear={() => clearSlot(s.key)}
                  onSpellcraft={() => setSpellcraftSlot(s.key)}
                />
              ))}
            </div>
          </Section>
        </div>

        {/* Stats panel */}
        <aside className="lg:sticky lg:top-[68px] lg:self-start">
          <Card className="p-5 bg-card/80 backdrop-blur space-y-5">
            <StatsPanel agg={agg} />
            <div className="border-t border-border/60 pt-4">
              <SuggestionsPanel
                result={suggestions}
                totalGemSlots={gemTotals.slotsAvail}
                totalGemUsed={gemTotals.used}
              />
            </div>
          </Card>
        </aside>
      </main>

      <ItemPickerDialog
        open={pickerSlot !== null}
        onClose={() => setPickerSlot(null)}
        slot={pickerSlot}
        realm={realm}
        className={className}
        onPick={pickItem}
      />

      <SpellcraftDialog
        open={spellcraftSlot !== null}
        onClose={() => setSpellcraftSlot(null)}
        slot={spellcraftSlot}
        item={spellcraftSlot ? itemsBySlot[spellcraftSlot] : undefined}
        gems={spellcraftSlot ? (spellcraft[spellcraftSlot] ?? []) : []}
        onChange={(gs) => {
          if (!spellcraftSlot) return;
          setSpellcraft((sc) => ({ ...sc, [spellcraftSlot]: gs }));
        }}
      />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-display text-sm uppercase tracking-widest text-muted-foreground mb-2">
        {title}
      </h2>
      {children}
    </section>
  );
}