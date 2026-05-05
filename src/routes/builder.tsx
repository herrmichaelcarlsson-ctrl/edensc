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
import { GearScorePanel } from "@/components/builder/GearScorePanel";
import { ResistHolePanel } from "@/components/builder/ResistHolePanel";
import { SlotActionDialog } from "@/components/builder/SlotActionDialog";
import { CustomItemDialog } from "@/components/builder/CustomItemDialog";
import { SLOTS } from "@/lib/daoc/slots";
import type { DBItem, Realm, SlotKey, TemplateSlots } from "@/lib/daoc/types";
import { aggregate } from "@/lib/daoc/aggregate";
import { isCraftable, inspectGems, type SpellcraftMap } from "@/lib/daoc/spellcraft";
import { suggestGems } from "@/lib/daoc/suggest";
import { loadState, saveState } from "@/lib/daoc/storage";
import { findRace } from "@/lib/daoc/races";
import { exportTemplateText } from "@/lib/daoc/export";
import { importZenkcraftText } from "@/lib/daoc/import";
import { ArrowLeft, FileText, Save, Trash2, Download, Upload, Globe2, GitCompare, Search } from "lucide-react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import type { ItemEffect } from "@/lib/daoc/types";

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
  const [race, setRace] = useState<string | null>(null);
  const [templateName, setTemplateName] = useState("Untitled Template");
  const [slots, setSlots] = useState<TemplateSlots>({});
  const [actionSlot, setActionSlot] = useState<SlotKey | null>(null);
  const [pickerSlot, setPickerSlot] = useState<SlotKey | null>(null);
  const [spellcraftSlot, setSpellcraftSlot] = useState<SlotKey | null>(null);
  const [customItemSlot, setCustomItemSlot] = useState<SlotKey | null>(null);
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
    setRace(s.race ?? null);
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
    saveState({ realm, className, race, slots, templateName, spellcraft });
  }, [realm, className, race, slots, templateName, spellcraft]);

  const itemsBySlot = useMemo(() => {
    const map: Partial<Record<SlotKey, DBItem | undefined>> = {};
    for (const k of Object.keys(slots) as SlotKey[]) {
      const id = slots[k];
      if (id) map[k] = itemsCache[id];
    }
    return map;
  }, [slots, itemsCache]);

  const raceDef = useMemo(() => findRace(realm, race), [realm, race]);
  const agg = useMemo(() => aggregate(itemsBySlot, spellcraft, raceDef), [itemsBySlot, spellcraft, raceDef]);
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

  function createCustomItem(slotKey: SlotKey, name: string, effects: ItemEffect[] = []) {
    const slotDef = SLOTS.find((entry) => entry.key === slotKey);
    if (!slotDef || !realm) return;
    const id = `custom:${slotKey}:${crypto.randomUUID()}`;
    const item: DBItem = {
      id,
      external_id: null,
      name,
      realm,
      slot: slotDef.dbSlots[0] ?? slotKey,
      item_level: 51,
      bonus_level: 51,
      required_level: 50,
      quality: 100,
      level: 51,
      class_restriction: className,
      armor_type: null,
      armor_af: null,
      weapon_type: null,
      weapon_damage_type: null,
      weapon_dps: null,
      weapon_speed: null,
      origin: "CUSTOM",
      source_type: "CUSTOM",
      online_url: null,
      effects,
    };
    setItemsCache((c) => ({ ...c, [item.id]: item }));
    setSlots((s) => ({ ...s, [slotKey]: item.id }));
    // Custom items: clear any spellcraft for this slot to avoid stale gems
    setSpellcraft((sc) => {
      const n = { ...sc };
      delete n[slotKey];
      return n;
    });
  }

  function createCraftedShell(slotKey: SlotKey, name: string) {
    const slotDef = SLOTS.find((entry) => entry.key === slotKey);
    if (!slotDef || !realm) return;
    const id = `crafted:${slotKey}:${crypto.randomUUID()}`;
    const item: DBItem = {
      id,
      external_id: null,
      name,
      realm,
      slot: slotDef.dbSlots[0] ?? slotKey,
      item_level: 51,
      bonus_level: 51,
      required_level: 50,
      quality: 100,
      level: 51,
      class_restriction: className,
      armor_type: null,
      armor_af: null,
      weapon_type: null,
      weapon_damage_type: null,
      weapon_dps: null,
      weapon_speed: null,
      origin: "CRAFTED",
      source_type: "CRAFTED",
      online_url: null,
      effects: [],
    };
    setItemsCache((c) => ({ ...c, [item.id]: item }));
    setSlots((s) => ({ ...s, [slotKey]: item.id }));
    setSpellcraft((sc) => ({ ...sc, [slotKey]: sc[slotKey] ?? [] }));
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
    const text = exportTemplateText(templateName, realm, className, itemsBySlot, agg, spellcraft);
    navigator.clipboard.writeText(text);
    // Also offer a download for sharing with the spellcrafter
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${templateName.replace(/[^a-z0-9]+/gi, "_")}_Summary.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("TXT exported (also copied to clipboard)");
  }

  async function publishToLibrary() {
    if (!realm) return;
    const code = (crypto.randomUUID?.() ?? Math.random().toString(36).slice(2)).slice(0, 8);
    const { error } = await supabase.from("saved_templates").insert({
      name: templateName,
      realm,
      class_name: className,
      slots: slots as never,
      spellcraft: spellcraft as never,
      is_public: true,
      share_code: code,
      gear_score: agg.score,
    });
    if (error) toast.error("Publish failed: " + error.message);
    else toast.success("Published to community library");
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
      const text = reader.result as string;
      const isText = f.name.toLowerCase().endsWith(".txt") || /Character Summary for/i.test(text);
      if (isText) {
        try {
          const r = importZenkcraftText(text, realm);
          if (r.realm) setRealm(r.realm);
          if (r.className) setClassName(r.className);
          setTemplateName(r.templateName);
          setItemsCache((c) => ({ ...c, ...r.items }));
          setSlots(r.slots);
          setSpellcraft(r.spellcraft);
          toast.success(`Imported ${Object.keys(r.slots).length} items from summary`);
        } catch (err) {
          console.error(err);
          toast.error("Failed to parse template summary");
        }
        e.target.value = "";
        return;
      }
      try {
        const obj = JSON.parse(text);
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
            <FileText className="h-4 w-4 mr-1.5" /> Export TXT
          </Button>
          <Button size="sm" variant="ghost" onClick={exportJson}>
            <Download className="h-4 w-4 mr-1.5" /> JSON
          </Button>
          <Link to="/items/browse" className="inline-flex items-center text-xs text-muted-foreground hover:text-foreground px-2 py-1.5">
            <Search className="h-4 w-4 mr-1.5" /> Browse items
          </Link>
          <Link to="/compare" className="inline-flex items-center text-xs text-muted-foreground hover:text-foreground px-2 py-1.5">
            <GitCompare className="h-4 w-4 mr-1.5" /> Compare
          </Link>
          <label className="inline-flex items-center text-sm cursor-pointer text-muted-foreground hover:text-foreground px-2 py-1.5 rounded">
            <Upload className="h-4 w-4 mr-1.5" /> Import
            <input type="file" accept="application/json,text/plain,.json,.txt" onChange={importJson} className="hidden" />
          </label>
          <Button size="sm" variant="ghost" onClick={clearAll}>
            <Trash2 className="h-4 w-4 mr-1.5" /> Clear
          </Button>
          <Button size="sm" variant="outline" onClick={publishToLibrary}>
            <Globe2 className="h-4 w-4 mr-1.5" /> Publish
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
                  onPick={() => setActionSlot(s.key)}
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
                  onPick={() => setActionSlot(s.key)}
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
                  onPick={() => setActionSlot(s.key)}
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
              <GearScorePanel agg={agg} />
            </div>
            <div className="border-t border-border/60 pt-4">
              <ResistHolePanel agg={agg} />
            </div>
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

      <SlotActionDialog
        open={actionSlot !== null}
        onClose={() => setActionSlot(null)}
        slotLabel={actionSlot ? (SLOTS.find((s) => s.key === actionSlot)?.label ?? actionSlot) : ""}
        onChooseItem={() => {
          if (!actionSlot) return;
          setPickerSlot(actionSlot);
          setActionSlot(null);
        }}
        onChooseSpellcraft={() => {
          if (!actionSlot) return;
          const existing = itemsBySlot[actionSlot];
          if (!existing) {
            createCraftedShell(actionSlot, `Crafted ${SLOTS.find((s) => s.key === actionSlot)?.label ?? "Item"}`);
          }
          setSpellcraftSlot(actionSlot);
          setActionSlot(null);
        }}
        onChooseCustom={() => {
          if (!actionSlot) return;
          setCustomItemSlot(actionSlot);
          setActionSlot(null);
        }}
      />

      <ItemPickerDialog
        open={pickerSlot !== null}
        onClose={() => setPickerSlot(null)}
        slot={pickerSlot}
        realm={realm}
        className={className}
        onPick={pickItem}
      />

      <CustomItemDialog
        open={customItemSlot !== null}
        onClose={() => setCustomItemSlot(null)}
        slotLabel={customItemSlot ? (SLOTS.find((s) => s.key === customItemSlot)?.label ?? customItemSlot) : ""}
        defaultName={customItemSlot ? `Custom ${SLOTS.find((s) => s.key === customItemSlot)?.label ?? "Item"}` : "Custom Item"}
        onSave={(name, effects) => {
          if (!customItemSlot) return;
          createCustomItem(customItemSlot, name, effects);
          setCustomItemSlot(null);
        }}
      />

      <SpellcraftDialog
        open={spellcraftSlot !== null}
        onClose={() => setSpellcraftSlot(null)}
        slot={spellcraftSlot}
        item={spellcraftSlot ? itemsBySlot[spellcraftSlot] : undefined}
        gems={spellcraftSlot ? (spellcraft[spellcraftSlot] ?? []) : []}
        realm={realm}
        agg={agg}
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