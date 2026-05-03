import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { SLOTS } from "@/lib/daoc/slots";
import { EFFECT_OPTIONS, EFFECT_GROUPS, effectById, type EffectGroup } from "@/lib/daoc/effect-catalog";

export const Route = createFileRoute("/items/submit")({
  head: () => ({
    meta: [
      { title: "Submit a community item — Eden Template Forge" },
      { name: "description", content: "Submit a drop, artifact or ToA item for inclusion in the community item database." },
    ],
  }),
  component: SubmitItemPage,
});

interface Eff { id: string; value: number; group: EffectGroup }

function SubmitItemPage() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [realm, setRealm] = useState<"Albion" | "Hibernia" | "Midgard">("Albion");
  const [slot, setSlot] = useState<string>("HELMETS");
  const [origin, setOrigin] = useState("DROP");
  const [classRestriction, setClassRestriction] = useState("");
  const [notes, setNotes] = useState("");
  const [effects, setEffects] = useState<Eff[]>([{ id: "STRENGTH", value: 10, group: "Stats" }]);
  const [busy, setBusy] = useState(false);

  function update(i: number, patch: Partial<Eff>) {
    setEffects((arr) => arr.map((e, idx) => idx === i ? { ...e, ...patch } : e));
  }
  function changeGroup(i: number, group: EffectGroup) {
    const first = EFFECT_OPTIONS.find((o) => o.group === group);
    update(i, { group, id: first?.id ?? "STRENGTH" });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return toast.error("Name required");
    setBusy(true);
    const { error } = await supabase.from("community_items").insert({
      name: name.trim(),
      realm, slot, origin,
      class_restriction: classRestriction.trim() || null,
      notes: notes.trim() || null,
      effects: effects.filter((x) => x.value !== 0) as never,
      submitted_by: user?.id ?? null,
      submitter_name: profile?.display_name ?? null,
    });
    setBusy(false);
    if (error) return toast.error(error.message);
    toast.success("Submitted — thanks!");
    navigate({ to: "/" });
  }

  return (
    <div className="min-h-screen px-4 py-10">
      <Toaster richColors position="bottom-right" />
      <div className="max-w-2xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary">
          <ArrowLeft className="h-4 w-4" /> Home
        </Link>
        <header className="mt-3 mb-6">
          <h1 className="font-display text-3xl text-primary">Submit a community item</h1>
          <p className="text-sm text-muted-foreground">Drops, artifacts and ToA items the main DB doesn't have yet.</p>
        </header>
        <Card className="p-5 bg-card/80">
          <form onSubmit={submit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5 col-span-2">
                <Label>Item name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label>Realm</Label>
                <Select value={realm} onValueChange={(v) => setRealm(v as never)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Albion">Albion</SelectItem>
                    <SelectItem value="Hibernia">Hibernia</SelectItem>
                    <SelectItem value="Midgard">Midgard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Slot</Label>
                <Select value={slot} onValueChange={setSlot}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SLOTS.map((s) => <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Origin</Label>
                <Select value={origin} onValueChange={setOrigin}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DROP">Drop</SelectItem>
                    <SelectItem value="ARTIFACT">Artifact</SelectItem>
                    <SelectItem value="ML">Master Level</SelectItem>
                    <SelectItem value="TOA">ToA</SelectItem>
                    <SelectItem value="QUEST">Quest reward</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Class restriction (optional)</Label>
                <Input value={classRestriction} onChange={(e) => setClassRestriction(e.target.value)} placeholder="Armsman" />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label>Bonuses</Label>
              <Button type="button" size="sm" variant="outline" className="h-7"
                  onClick={() => setEffects((a) => [...a, { id: "STRENGTH", value: 1, group: "Stats" }])}>
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add
                </Button>
              </div>
              {effects.map((eff, i) => {
                const def = effectById(eff.id);
                const opts = EFFECT_OPTIONS.filter((o) => o.group === eff.group);
                return (
                  <div key={i} className="grid grid-cols-[1fr_1.4fr_90px_auto] gap-2 items-center">
                    <Select value={eff.group} onValueChange={(v) => changeGroup(i, v as EffectGroup)}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {EFFECT_GROUPS.map((g) => <SelectItem key={g} value={g} className="text-xs">{g}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <Select value={eff.id} onValueChange={(v) => update(i, { id: v })}>
                      <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {opts.map((o) => <SelectItem key={o.id} value={o.id} className="text-xs">{o.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <div className="relative">
                      <Input type="number" value={eff.value}
                        onChange={(e) => update(i, { value: parseInt(e.target.value, 10) || 0 })}
                        className="h-8 text-xs pr-6" />
                      {def?.suffix && <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">{def.suffix}</span>}
                    </div>
                    <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0"
                      onClick={() => setEffects((a) => a.filter((_, j) => j !== i))}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                );
              })}
            </div>

            <div className="space-y-1.5">
              <Label>Notes (optional)</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} placeholder="Where it drops, charge/proc info, etc." />
            </div>

            <div className="flex justify-end pt-2">
              <Button type="submit" disabled={busy}>{busy ? "Submitting…" : "Submit item"}</Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}
