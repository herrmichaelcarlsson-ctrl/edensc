import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { ArrowLeft, ArrowUp, Loader2, Sparkles } from "lucide-react";
import { getVoterKey } from "@/lib/voter";

export const Route = createFileRoute("/templates")({
  head: () => ({
    meta: [
      { title: "Community Template Library — Eden Template Forge" },
      { name: "description", content: "Browse, vote and copy DAoC character templates shared by the community." },
    ],
  }),
  component: TemplatesPage,
});

interface Row {
  id: string;
  name: string;
  realm: string;
  class_name: string | null;
  vote_count: number;
  view_count: number;
  gear_score: number | null;
  author_name: string | null;
  share_code: string | null;
  created_at: string;
}

function TemplatesPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [voted, setVoted] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [realm, setRealm] = useState<string>("All");

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("saved_templates")
      .select("id,name,realm,class_name,vote_count,view_count,gear_score,author_name,share_code,created_at")
      .eq("is_public", true)
      .order("vote_count", { ascending: false })
      .limit(200);
    if (error) toast.error(error.message);
    setRows((data ?? []) as Row[]);
    const voter = getVoterKey();
    const { data: votes } = await supabase
      .from("template_votes").select("template_id").eq("voter_key", voter);
    setVoted(new Set((votes ?? []).map((v) => v.template_id)));
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function toggleVote(id: string) {
    const voter = getVoterKey();
    if (voted.has(id)) {
      const { error } = await supabase.from("template_votes")
        .delete().eq("template_id", id).eq("voter_key", voter);
      if (error) return toast.error(error.message);
      setVoted((s) => { const n = new Set(s); n.delete(id); return n; });
      setRows((r) => r.map((x) => x.id === id ? { ...x, vote_count: Math.max(0, x.vote_count - 1) } : x));
    } else {
      const { error } = await supabase.from("template_votes")
        .insert({ template_id: id, voter_key: voter });
      if (error) return toast.error(error.message);
      setVoted((s) => new Set(s).add(id));
      setRows((r) => r.map((x) => x.id === id ? { ...x, vote_count: x.vote_count + 1 } : x));
    }
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) =>
      (realm === "All" || r.realm === realm)
      && (!q || r.name.toLowerCase().includes(q) || (r.class_name ?? "").toLowerCase().includes(q)),
    );
  }, [rows, search, realm]);

  return (
    <div className="min-h-screen px-4 py-10">
      <Toaster richColors position="bottom-right" />
      <div className="max-w-5xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary">
          <ArrowLeft className="h-4 w-4" /> Home
        </Link>
        <header className="mt-3 mb-6">
          <h1 className="font-display text-3xl md:text-4xl text-primary">Community Library</h1>
          <p className="text-sm text-muted-foreground mt-1">Browse and vote on templates shared by other players.</p>
        </header>

        <div className="flex flex-wrap items-center gap-2 mb-5">
          <Input placeholder="Search by name or class…" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
          <div className="flex gap-1">
            {["All", "Albion", "Hibernia", "Midgard"].map((r) => (
              <button key={r} onClick={() => setRealm(r)}
                className={`px-3 py-1.5 text-xs rounded border ${realm === r ? "bg-primary text-primary-foreground border-primary" : "border-border hover:border-primary/50"}`}>
                {r}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center p-12 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading…
          </div>
        ) : filtered.length === 0 ? (
          <Card className="p-8 text-center text-muted-foreground">
            <Sparkles className="h-6 w-6 mx-auto mb-2 opacity-60" />
            No public templates yet. Be the first — open a template and click "Publish".
          </Card>
        ) : (
          <div className="grid gap-2">
            {filtered.map((t) => (
              <Card key={t.id} className="p-4 flex items-center gap-3 bg-card/80 backdrop-blur">
                <button onClick={() => toggleVote(t.id)}
                  className={`flex flex-col items-center justify-center px-2 py-1.5 rounded border min-w-[52px] ${voted.has(t.id) ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/50"}`}>
                  <ArrowUp className="h-4 w-4" />
                  <span className="text-xs font-semibold tabular-nums">{t.vote_count}</span>
                </button>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium truncate">{t.name}</span>
                    <Badge variant="outline" className="text-[10px]">{t.realm}</Badge>
                    {t.class_name && <Badge variant="secondary" className="text-[10px]">{t.class_name}</Badge>}
                    {t.gear_score != null && <Badge className="text-[10px]">Score {t.gear_score}</Badge>}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    by {t.author_name ?? "anonymous"} · {new Date(t.created_at).toLocaleDateString()}
                  </div>
                </div>
                {t.share_code && (
                  <Button size="sm" variant="outline" onClick={() => {
                    navigator.clipboard.writeText(`${location.origin}/templates?code=${t.share_code}`);
                    toast.success("Share link copied");
                  }}>Share</Button>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
