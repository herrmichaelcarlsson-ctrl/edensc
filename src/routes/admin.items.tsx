import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { ArrowLeft, Check, Loader2, Trash2 } from "lucide-react";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/items")({
  head: () => ({ meta: [{ title: "Pending Items — Admin" }] }),
  component: AdminItemsPage,
});

interface Row {
  id: string;
  name: string;
  realm: string;
  slot: string;
  class_restriction: string | null;
  origin: string | null;
  effects: { id: string; value: number }[];
  submitter_name: string | null;
  notes: string | null;
  created_at: string;
}

function AdminItemsPage() {
  const { user, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const [rows, setRows] = useState<Row[]>([]);
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!user) navigate({ to: "/login" });
  }, [user, loading, navigate]);

  async function refresh() {
    setBusy(true);
    const { data, error } = await supabase
      .from("community_items")
      .select("id,name,realm,slot,class_restriction,origin,effects,submitter_name,notes,created_at")
      .eq("approved", false)
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setRows((data ?? []) as unknown as Row[]);
    setBusy(false);
  }

  useEffect(() => {
    if (isAdmin) refresh();
  }, [isAdmin]);

  async function approve(id: string) {
    const { error } = await supabase.from("community_items").update({ approved: true }).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Approved"); setRows((p) => p.filter((r) => r.id !== id)); }
  }

  async function reject(id: string) {
    if (!confirm("Reject and delete this submission?")) return;
    const { error } = await supabase.from("community_items").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Deleted"); setRows((p) => p.filter((r) => r.id !== id)); }
  }

  if (loading || (user && !isAdmin)) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Admins only."}
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Toaster richColors position="bottom-right" />
      <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur">
        <div className="max-w-[1200px] mx-auto px-4 py-3 flex items-center gap-3">
          <Link to="/" className="text-muted-foreground hover:text-primary"><ArrowLeft className="h-4 w-4" /></Link>
          <h1 className="font-display text-lg">Pending Community Items</h1>
          <span className="text-xs text-muted-foreground">({rows.length})</span>
          <div className="flex-1" />
          <Link to="/admin/formulas" className="text-xs text-muted-foreground hover:text-primary">Formulas →</Link>
        </div>
      </header>
      <main className="max-w-[1200px] mx-auto px-4 py-6">
        {busy ? (
          <div className="text-center text-muted-foreground py-12"><Loader2 className="h-5 w-5 animate-spin inline" /></div>
        ) : rows.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">No pending submissions.</p>
        ) : (
          <div className="space-y-2">
            {rows.map((r) => (
              <Card key={r.id} className="p-3 bg-card/80 backdrop-blur">
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium">{r.name}</span>
                      <Badge variant="outline" className="text-[10px]">{r.realm}</Badge>
                      <Badge variant="secondary" className="text-[10px]">{r.slot}</Badge>
                      {r.origin && <Badge variant="outline" className="text-[10px]">{r.origin}</Badge>}
                      {r.class_restriction && <Badge variant="outline" className="text-[10px]">{r.class_restriction}</Badge>}
                      <span className="text-[10px] text-muted-foreground ml-auto">
                        by {r.submitter_name ?? "anon"} · {new Date(r.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    {r.notes && <p className="text-xs text-muted-foreground mt-1">{r.notes}</p>}
                    <div className="mt-1 flex flex-wrap gap-1">
                      {(r.effects ?? []).map((e, i) => (
                        <span key={i} className="text-[10px] rounded px-1.5 py-0.5 bg-muted text-muted-foreground">
                          +{e.value} {e.id.replace(/_/g, " ")}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5 shrink-0">
                    <Button size="sm" onClick={() => approve(r.id)}><Check className="h-3.5 w-3.5 mr-1" /> Approve</Button>
                    <Button size="sm" variant="ghost" onClick={() => reject(r.id)}><Trash2 className="h-3.5 w-3.5 mr-1" /> Reject</Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}