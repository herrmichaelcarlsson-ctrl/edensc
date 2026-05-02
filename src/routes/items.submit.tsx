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

export const Route = createFileRoute("/items/submit")({
  head: () => ({
    meta: [
      { title: "Submit a community item — Eden Template Forge" },
      { name: "description", content: "Submit a drop, artifact or ToA item for inclusion in the community item database." },
    ],
  }),
  component: SubmitItemPage,
});

interface Eff { id: string; value: number }

function SubmitItemPage() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [realm, setRealm] = useState<"Albion" | "Hibernia" | "Midgard">("Albion");
  const [slot, setSlot] = useState<string>("HELMETS");
  const [origin, setOrigin] = useState("DROP");
  const [classRestriction, setClassRestriction] = useState("");
  const [notes, setNotes] = useState("");
  const [effects, setEffects] = useState<Eff[]>([{ id: "STRENGTH", value: 10 }]);
  const [busy, setBusy] = useState(false);

  function update(i: number, patch: Partial<Eff>) {
    setEffects((arr) => arr.map((e, idx) => idx === i ? { ...e, ...patch } : e));
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
                  onClick={() => setEffects((a) => [...a, { id: "STRENGTH", value: 1 }])}>
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add
                </Button>
              </div>
              {effects.map((eff, i) => (
                <div key={i} className="grid grid-cols-[1fr_90px_auto] gap-2">
                  <Input value={eff.id} onChange={(e) => update(i, { id: e.target.value.toUpperCase() })} className="h-8 text-xs" />
                  <Input type="number" value={eff.value} onChange={(e) => update(i, { value: parseInt(e.target.value, 10) || 0 })} className="h-8 text-xs" />
                  <Button type="button" variant="ghost" size="sm" className="h-8 w-8 p-0"
                    onClick={() => setEffects((a) => a.filter((_, j) => j !== i))}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
              <p className="text-[11px] text-muted-foreground">
                Effect IDs: STRENGTH, CONSTITUTION, RES_HEAT, CAP_STRENGTH, MELEE_DAMAGE, etc.
              </p>
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
