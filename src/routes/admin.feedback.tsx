import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  verifyAdminPassword,
  updateFeatureRequestStatus,
  deleteFeatureRequest,
} from "@/server/feature-requests";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Toaster } from "@/components/ui/sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Loader2, Trash2, Lock } from "lucide-react";
import { toast } from "sonner";
import type { FeatureRequest } from "@/components/feature-requests/FeatureRequestsBoard";

const ADMIN_KEY = "daoc-template-builder:admin-pw:v1";

export const Route = createFileRoute("/admin/feedback")({
  head: () => ({
    meta: [{ title: "Admin — Önskemål" }],
  }),
  component: AdminFeedbackPage,
});

function AdminFeedbackPage() {
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(false);
  const [items, setItems] = useState<FeatureRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  // Try saved password
  useEffect(() => {
    const saved = typeof window !== "undefined" ? localStorage.getItem(ADMIN_KEY) : null;
    if (saved) {
      setPassword(saved);
      void tryLogin(saved, true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function tryLogin(pw: string, silent = false) {
    setChecking(true);
    try {
      const res = await verifyAdminPassword({ data: { password: pw } });
      if (res.ok) {
        setAuthed(true);
        localStorage.setItem(ADMIN_KEY, pw);
        await refresh();
      } else {
        if (!silent) toast.error("Fel lösenord");
        localStorage.removeItem(ADMIN_KEY);
        setAuthed(false);
      }
    } catch (e) {
      if (!silent) toast.error("Inloggning misslyckades");
    }
    setChecking(false);
  }

  async function refresh() {
    setLoading(true);
    const client = supabase.from("feature_requests" as never) as unknown as {
      select: (q: string) => Promise<{ data: FeatureRequest[] | null; error: { message: string } | null }>;
    };
    const { data, error } = await client.select("*");
    if (error) toast.error(error.message);
    setItems(
      (data ?? []).sort((a, b) => {
        const order = { open: 0, planned: 1, done: 2, rejected: 3 } as const;
        if (order[a.status] !== order[b.status]) return order[a.status] - order[b.status];
        return b.vote_count - a.vote_count;
      }),
    );
    setLoading(false);
  }

  async function changeStatus(id: string, status: FeatureRequest["status"]) {
    setBusyId(id);
    try {
      await updateFeatureRequestStatus({ data: { password, id, status } });
      setItems((arr) => arr.map((it) => (it.id === id ? { ...it, status } : it)));
      toast.success("Status uppdaterad");
    } catch (e) {
      toast.error("Kunde inte uppdatera");
    }
    setBusyId(null);
  }

  async function remove(id: string) {
    if (!confirm("Ta bort önskemålet?")) return;
    setBusyId(id);
    try {
      await deleteFeatureRequest({ data: { password, id } });
      setItems((arr) => arr.filter((it) => it.id !== id));
      toast.success("Borttaget");
    } catch (e) {
      toast.error("Kunde inte ta bort");
    }
    setBusyId(null);
  }

  function logout() {
    localStorage.removeItem(ADMIN_KEY);
    setPassword("");
    setAuthed(false);
  }

  return (
    <div className="min-h-screen">
      <Toaster richColors position="bottom-right" />
      <header className="border-b border-border bg-background/85 backdrop-blur">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link to="/" className="text-muted-foreground hover:text-primary">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h1 className="font-display text-xl flex items-center gap-2">
            <Lock className="h-4 w-4" />
            Admin — Önskemål
          </h1>
          <div className="flex-1" />
          {authed && (
            <Button size="sm" variant="ghost" onClick={logout}>
              Logga ut
            </Button>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {!authed ? (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              tryLogin(password);
            }}
            className="max-w-sm space-y-3 rounded-lg border border-border bg-card/60 p-4"
          >
            <label className="text-sm">Adminlösenord</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoFocus
            />
            <Button type="submit" disabled={checking || !password} className="w-full">
              {checking && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Logga in
            </Button>
          </form>
        ) : loading ? (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" /> Laddar…
          </div>
        ) : items.length === 0 ? (
          <div className="text-muted-foreground text-sm">Inga önskemål ännu.</div>
        ) : (
          <ul className="space-y-2">
            {items.map((req) => (
              <li
                key={req.id}
                className="flex flex-col sm:flex-row gap-3 rounded-md border border-border bg-card/40 p-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium">{req.title}</span>
                    <Badge variant="outline" className="text-[10px]">
                      {req.vote_count} röster
                    </Badge>
                    {req.author_name && (
                      <span className="text-[10px] text-muted-foreground">
                        av {req.author_name}
                      </span>
                    )}
                  </div>
                  {req.description && (
                    <p className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap">
                      {req.description}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Select
                    value={req.status}
                    onValueChange={(v) =>
                      changeStatus(req.id, v as FeatureRequest["status"])
                    }
                    disabled={busyId === req.id}
                  >
                    <SelectTrigger className="h-8 text-xs w-[130px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="planned">Planerad</SelectItem>
                      <SelectItem value="done">Klart ✓</SelectItem>
                      <SelectItem value="rejected">Avvisad</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => remove(req.id)}
                    disabled={busyId === req.id}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}