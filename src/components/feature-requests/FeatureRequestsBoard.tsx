import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ChevronUp, Loader2, MessageSquarePlus, CheckCircle2, Clock, ListTodo } from "lucide-react";
import { cn } from "@/lib/utils";
import { getVoterKey } from "@/lib/voter";
import { toast } from "sonner";

export interface FeatureRequest {
  id: string;
  title: string;
  description: string | null;
  author_name: string | null;
  status: "open" | "planned" | "done" | "rejected";
  vote_count: number;
  created_at: string;
}

const STATUS_META: Record<FeatureRequest["status"], { label: string; icon: typeof Clock; tone: string }> = {
  open: { label: "Open", icon: ListTodo, tone: "text-foreground" },
  planned: { label: "Planerad", tone: "text-status-near", icon: Clock },
  done: { label: "Klart", tone: "text-status-capped", icon: CheckCircle2 },
  rejected: { label: "Avvisad", tone: "text-muted-foreground", icon: Clock },
};

interface Props {
  /** When true, hides closed/rejected items unless toggled. */
  compact?: boolean;
}

export function FeatureRequestsBoard({ compact = false }: Props) {
  const [items, setItems] = useState<FeatureRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [voted, setVoted] = useState<Record<string, boolean>>({});
  const [showDone, setShowDone] = useState(!compact);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [author, setAuthor] = useState("");

  const voterKey = useMemo(() => getVoterKey(), []);

  async function refresh() {
    setLoading(true);
    const [list, mine] = await Promise.all([
      (supabase.from("feature_requests" as never) as unknown as {
        select: (q: string) => Promise<{ data: FeatureRequest[] | null; error: { message: string } | null }>;
      }).select("*"),
      (supabase.from("feature_request_votes" as never) as unknown as {
        select: (q: string) => { eq: (col: string, v: string) => Promise<{ data: { request_id: string }[] | null; error: { message: string } | null }> };
      }).select("request_id").eq("voter_key", voterKey),
    ]);
    if (list.error) {
      toast.error("Kunde inte hämta önskemål: " + list.error.message);
      setItems([]);
    } else {
      const sorted = [...(list.data ?? [])].sort((a, b) => {
        const order = { open: 0, planned: 1, done: 2, rejected: 3 } as const;
        if (order[a.status] !== order[b.status]) return order[a.status] - order[b.status];
        return b.vote_count - a.vote_count;
      });
      setItems(sorted);
    }
    if (!mine.error && mine.data) {
      const map: Record<string, boolean> = {};
      for (const v of mine.data) map[v.request_id] = true;
      setVoted(map);
    }
    setLoading(false);
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const t = title.trim();
    if (t.length < 3) {
      toast.error("Titeln måste vara minst 3 tecken");
      return;
    }
    if (t.length > 120) {
      toast.error("Titeln får vara max 120 tecken");
      return;
    }
    setSubmitting(true);
    const insertClient = supabase.from("feature_requests" as never) as unknown as {
      insert: (rows: Record<string, unknown>) => Promise<{ error: { message: string } | null }>;
    };
    const { error } = await insertClient.insert({
      title: t,
      description: description.trim() || null,
      author_name: author.trim() || null,
    });
    setSubmitting(false);
    if (error) {
      toast.error("Misslyckades: " + error.message);
      return;
    }
    setTitle("");
    setDescription("");
    toast.success("Tack! Önskemålet är skickat.");
    refresh();
  }

  async function toggleVote(req: FeatureRequest) {
    const has = voted[req.id];
    setVoted((v) => ({ ...v, [req.id]: !has }));
    setItems((arr) =>
      arr.map((it) =>
        it.id === req.id ? { ...it, vote_count: it.vote_count + (has ? -1 : 1) } : it,
      ),
    );
    const votesTbl = supabase.from("feature_request_votes" as never) as unknown as {
      insert: (rows: Record<string, unknown>) => Promise<{ error: { message: string } | null }>;
      delete: () => { eq: (c: string, v: string) => { eq: (c: string, v: string) => Promise<{ error: { message: string } | null }> } };
    };
    if (has) {
      const { error } = await votesTbl
        .delete()
        .eq("request_id", req.id)
        .eq("voter_key", voterKey);
      if (error) {
        toast.error("Kunde inte ångra rösten");
        refresh();
      }
    } else {
      const { error } = await votesTbl.insert({ request_id: req.id, voter_key: voterKey });
      if (error) {
        toast.error("Kunde inte rösta");
        refresh();
      }
    }
  }

  const visible = items.filter((it) => showDone || (it.status !== "done" && it.status !== "rejected"));

  return (
    <div className="space-y-5">
      <form onSubmit={submit} className="space-y-2 rounded-lg border border-border bg-card/60 p-4 backdrop-blur">
        <div className="flex items-center gap-2 text-sm font-medium">
          <MessageSquarePlus className="h-4 w-4 text-primary" />
          Skicka önskemål
        </div>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Kort titel (t.ex. 'Lägg till auto-optimizer')"
          maxLength={120}
          required
        />
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Beskriv önskemålet (valfritt, max 2000 tecken)"
          maxLength={2000}
          rows={3}
        />
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="Ditt namn (valfritt)"
            maxLength={60}
            className="sm:max-w-xs"
          />
          <div className="flex-1" />
          <Button type="submit" size="sm" disabled={submitting}>
            {submitting && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
            Skicka
          </Button>
        </div>
      </form>

      <div className="flex items-center justify-between">
        <h3 className="font-display text-sm uppercase tracking-widest text-muted-foreground">
          Önskemål ({items.length})
        </h3>
        <button
          type="button"
          className="text-xs text-muted-foreground hover:text-primary transition-colors"
          onClick={() => setShowDone((v) => !v)}
        >
          {showDone ? "Dölj klara" : "Visa klara"}
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin mr-2" /> Laddar…
        </div>
      ) : visible.length === 0 ? (
        <div className="rounded-md border border-dashed border-border p-6 text-center text-muted-foreground text-sm">
          Inga önskemål ännu. Bli först!
        </div>
      ) : (
        <ul className="space-y-2">
          {visible.map((req) => {
            const meta = STATUS_META[req.status];
            const Icon = meta.icon;
            const has = !!voted[req.id];
            const isClosed = req.status === "done" || req.status === "rejected";
            return (
              <li
                key={req.id}
                className={cn(
                  "flex gap-3 rounded-md border border-border bg-card/40 p-3 backdrop-blur transition-colors",
                  isClosed && "opacity-70",
                )}
              >
                <button
                  type="button"
                  onClick={() => toggleVote(req)}
                  className={cn(
                    "flex flex-col items-center justify-center w-12 shrink-0 rounded-md border transition-colors",
                    has
                      ? "bg-primary/15 border-primary/50 text-primary"
                      : "bg-muted/40 border-border text-muted-foreground hover:text-primary hover:border-primary/40",
                  )}
                  aria-label={has ? "Ta bort röst" : "Rösta"}
                >
                  <ChevronUp className="h-4 w-4" />
                  <span className="text-xs tabular-nums font-medium">{req.vote_count}</span>
                </button>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={cn("font-medium leading-tight", isClosed && "line-through")}>
                      {req.title}
                    </span>
                    <Badge variant="outline" className={cn("text-[10px] gap-1", meta.tone)}>
                      <Icon className="h-3 w-3" />
                      {meta.label}
                    </Badge>
                  </div>
                  {req.description && (
                    <p className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap">
                      {req.description}
                    </p>
                  )}
                  {req.author_name && (
                    <p className="text-[10px] text-muted-foreground mt-1">— {req.author_name}</p>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}