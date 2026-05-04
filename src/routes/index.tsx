import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CLASSES } from "@/lib/daoc/classes";
import type { Realm } from "@/lib/daoc/types";
import { saveState, loadState } from "@/lib/daoc/storage";
import { Sword, Shield, Sparkles, LogIn, LogOut, LibraryBig, Plus } from "lucide-react";
import { FeatureRequestsBoard } from "@/components/feature-requests/FeatureRequestsBoard";
import { Toaster } from "@/components/ui/sonner";
import realmsBg from "@/assets/realms-bg.png";
import { racesForRealm } from "@/lib/daoc/races";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "DAoC Template Builder & Spellcraft Calculator" },
      { name: "description", content: "Build, calculate and optimize Dark Age of Camelot character templates with live cap tracking and spellcraft assistance." },
    ],
  }),
  component: HomePage,
});

const REALM_INFO: { realm: Realm; tagline: string; color: string; icon: typeof Shield }[] = [
  { realm: "Albion",   tagline: "The realm of Arthur", color: "bg-realm-albion",   icon: Shield },
  { realm: "Hibernia", tagline: "The land of mist",    color: "bg-realm-hibernia", icon: Sparkles },
  { realm: "Midgard",  tagline: "The frozen north",    color: "bg-realm-midgard",  icon: Sword },
];

function HomePage() {
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const [realm, setRealm] = useState<Realm | null>(null);
  const [className, setClassName] = useState<string | null>(null);
  const [race, setRace] = useState<string | null>(null);
  const [templateCount, setTemplateCount] = useState<number | null>(null);

  useEffect(() => {
    (async () => {
      const { count } = await supabase
        .from("saved_templates")
        .select("id", { count: "exact", head: true })
        .eq("is_public", true);
      setTemplateCount(count ?? 0);
    })();
  }, []);

  function handleStart() {
    if (!realm) return;
    const prev = loadState();
    saveState({
      realm,
      className,
      race,
      slots: prev?.realm === realm ? prev.slots : {},
      templateName: prev?.templateName ?? "Untitled Template",
    });
    navigate({ to: "/builder" });
  }

  const races = racesForRealm(realm);

  return (
    <div className="min-h-screen px-4 py-12 md:py-20 relative">
      <div
        className="realm-bg"
        style={{ backgroundImage: `url(${realmsBg})` }}
        aria-hidden
      />
      <div className="realm-bg-overlay" aria-hidden />
      <Toaster richColors position="bottom-right" />
      <nav className="absolute top-4 right-4 z-10 flex items-center gap-2 text-xs">
        <Link to="/templates" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-border bg-card/60 hover:border-primary/50">
          <LibraryBig className="h-3.5 w-3.5" /> Library
          {templateCount != null && <span className="text-muted-foreground ml-1">({templateCount})</span>}
        </Link>
        <Link to="/items/submit" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-border bg-card/60 hover:border-primary/50">
          <Plus className="h-3.5 w-3.5" /> Submit item
        </Link>
        {user ? (
          <>
            <span className="text-muted-foreground hidden sm:inline">Hi, {profile?.display_name ?? "player"}</span>
            <button onClick={() => signOut()} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-border bg-card/60 hover:border-primary/50">
              <LogOut className="h-3.5 w-3.5" /> Sign out
            </button>
          </>
        ) : (
          <Link to="/login" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-border bg-card/60 hover:border-primary/50">
            <LogIn className="h-3.5 w-3.5" /> Sign in
          </Link>
        )}
      </nav>
      <div className="max-w-5xl mx-auto">
        <header className="text-center mb-12">
          <h1 className="font-display text-4xl md:text-6xl text-primary mb-3">
            Eden Template Forge
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Craft, calculate and optimize Dark Age of Camelot character templates.
            Live cap tracking, spellcraft assistance, full Eden item database.
          </p>
          {templateCount != null && (
            <p className="text-xs text-muted-foreground/80 mt-3">
              <span className="text-primary font-semibold tabular-nums">{templateCount}</span> community templates published
            </p>
          )}
        </header>

        <Card className="p-6 md:p-8 bg-card/80 backdrop-blur border-border">
          <h2 className="font-display text-xl mb-1">1. Choose your realm</h2>
          <p className="text-sm text-muted-foreground mb-5">Items are filtered by realm.</p>
          <div className="grid md:grid-cols-3 gap-3 mb-8">
            {REALM_INFO.map((r) => {
              const Icon = r.icon;
              const active = realm === r.realm;
              return (
                <button
                  key={r.realm}
                  onClick={() => { setRealm(r.realm); setClassName(null); setRace(null); }}
                  className={`group relative overflow-hidden rounded-lg border p-5 text-left transition-all ${
                    active
                      ? "border-primary ring-2 ring-primary/40 bg-card"
                      : "border-border bg-card/40 hover:border-primary/50 hover:bg-card"
                  }`}
                >
                  <div className={`absolute inset-0 opacity-10 ${r.color}`} />
                  <div className="relative">
                    <Icon className="h-6 w-6 mb-2 text-primary" />
                    <div className="font-display text-lg">{r.realm}</div>
                    <div className="text-xs text-muted-foreground">{r.tagline}</div>
                  </div>
                </button>
              );
            })}
          </div>

          <h2 className="font-display text-xl mb-1">2. Choose your race <span className="text-sm text-muted-foreground font-body">(optional)</span></h2>
          <p className="text-sm text-muted-foreground mb-4">
            Race base stats and innate resists are factored into your template.
          </p>
          <div className="flex flex-wrap gap-2 mb-8 min-h-[40px]">
            {realm ? (
              races.map((r) => (
                <button
                  key={r.name}
                  onClick={() => setRace(r.name === race ? null : r.name)}
                  className={`px-3 py-1.5 rounded text-xs border transition-colors ${
                    race === r.name
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border hover:border-primary/50 text-foreground/80"
                  }`}
                >
                  {r.name}
                </button>
              ))
            ) : (
              <span className="text-sm text-muted-foreground">Pick a realm first.</span>
            )}
          </div>

          <h2 className="font-display text-xl mb-1">3. Choose your class <span className="text-sm text-muted-foreground font-body">(optional)</span></h2>
          <p className="text-sm text-muted-foreground mb-4">
            Filters items with class restrictions. Skip to see everything.
          </p>
          <div className="flex flex-wrap gap-2 mb-8 min-h-[40px]">
            {realm ? (
              CLASSES[realm].map((c) => (
                <button
                  key={c}
                  onClick={() => setClassName(c === className ? null : c)}
                  className={`px-3 py-1.5 rounded text-xs border transition-colors ${
                    className === c
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border hover:border-primary/50 text-foreground/80"
                  }`}
                >
                  {c}
                </button>
              ))
            ) : (
              <span className="text-sm text-muted-foreground">Pick a realm first.</span>
            )}
          </div>

          <Button
            size="lg"
            disabled={!realm}
            onClick={handleStart}
            className="w-full md:w-auto"
          >
            Start building →
          </Button>
        </Card>

        <footer className="mt-10 text-center text-xs text-muted-foreground">
          Item data exported from <span className="text-foreground/70">eden-daoc.net</span> · 16,483 items indexed
        </footer>

        <section className="mt-16">
          <header className="text-center mb-6">
            <h2 className="font-display text-2xl md:text-3xl text-primary mb-2">
              Feature Requests
            </h2>
            <p className="text-sm text-muted-foreground max-w-xl mx-auto">
              Submit ideas, vote on what matters most, and watch them get shipped.
            </p>
          </header>
          <Card className="p-5 md:p-6 bg-card/80 backdrop-blur border-border">
            <FeatureRequestsBoard />
          </Card>
        </section>
      </div>
    </div>
  );
}
