import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/formulas")({
  head: () => ({ meta: [{ title: "Formula Config — Admin" }] }),
  component: AdminFormulasPage,
});

interface Row {
  id: string;
  label: string;
  description: string | null;
  config: unknown;
}

function AdminFormulasPage() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [rows, setRows] = useState<Row[]>([]);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) navigate({ to: "/login" });
  }, [user, loading, navigate]);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("formula_config").select("id,label,description,config").order("id");
      setRows((data ?? []) as Row[]);
      const d: Record<string, string> = {};
      for (const r of data ?? []) d[r.id] = JSON.stringify(r.config, null, 2);
      setDrafts(d);
    })();
  }, []);

  async function save(id: string) {
    let parsed: unknown;
    try { parsed = JSON.parse(drafts[id]); } catch { return toast.error("Invalid JSON"); }
    setBusy(id);
    const { error } = await supabase.from("formula_config")
      .update({ config: parsed as never, updated_by: user?.id ?? null })
      .eq("id", id);
    setBusy(null);
    if (error) toast.error(error.message);
    else toast.success(`Saved ${id}`);
  }

  if (loading) return <div className="p-12 text-center text-muted-foreground"><Loader2 className="inline h-5 w-5 animate-spin mr-2" />Loading…</div>;

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8 text-center">
        <Card className="p-8 max-w-md">
          <h1 className="font-display text-xl mb-2">Admin only</h1>
          <p className="text-sm text-muted-foreground mb-4">This page requires the admin role.</p>
          <Link to="/"><Button variant="outline" size="sm">Back home</Button></Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-10">
      <Toaster richColors position="bottom-right" />
      <div className="max-w-4xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary">
          <ArrowLeft className="h-4 w-4" /> Home
        </Link>
        <header className="mt-3 mb-6">
          <h1 className="font-display text-3xl text-primary">Formula Config</h1>
          <p className="text-sm text-muted-foreground">Tune scoring weights, overcharge risk and other math constants used by the engine.</p>
        </header>
        <div className="space-y-4">
          {rows.map((r) => (
            <Card key={r.id} className="p-4 bg-card/80">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <h2 className="font-display text-base">{r.label}</h2>
                  <code className="text-[10px] text-muted-foreground">{r.id}</code>
                  {r.description && <p className="text-xs text-muted-foreground mt-1">{r.description}</p>}
                </div>
                <Button size="sm" onClick={() => save(r.id)} disabled={busy === r.id}>
                  <Save className="h-3.5 w-3.5 mr-1.5" /> {busy === r.id ? "Saving…" : "Save"}
                </Button>
              </div>
              <Textarea rows={10} value={drafts[r.id] ?? ""} onChange={(e) => setDrafts((d) => ({ ...d, [r.id]: e.target.value }))}
                className="font-mono text-xs" />
            </Card>
          ))}
          {rows.length === 0 && <p className="text-sm text-muted-foreground">No config rows yet.</p>}
        </div>
      </div>
    </div>
  );
}
