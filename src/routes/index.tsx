import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CLASSES } from "@/lib/daoc/classes";
import type { Realm } from "@/lib/daoc/types";
import { saveState, loadState } from "@/lib/daoc/storage";
import { Sword, Shield, Sparkles } from "lucide-react";
import { FeatureRequestsBoard } from "@/components/feature-requests/FeatureRequestsBoard";
import { Toaster } from "@/components/ui/sonner";
import realmsBg from "@/assets/realms-bg.png";

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
  const [realm, setRealm] = useState<Realm | null>(null);
  const [className, setClassName] = useState<string | null>(null);

  function handleStart() {
    if (!realm) return;
    const prev = loadState();
    saveState({
      realm,
      className,
      slots: prev?.realm === realm ? prev.slots : {},
      templateName: prev?.templateName ?? "Untitled Template",
    });
    navigate({ to: "/builder" });
  }

  return (
    <div className="min-h-screen px-4 py-12 md:py-20 relative">
      <div
        className="realm-bg"
        style={{ backgroundImage: `url(${realmsBg})` }}
        aria-hidden
      />
      <div className="realm-bg-overlay" aria-hidden />
      <Toaster richColors position="bottom-right" />
      <div className="max-w-5xl mx-auto">
        <header className="text-center mb-12">
          <h1 className="font-display text-4xl md:text-6xl text-primary mb-3">
            Eden Template Forge
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Craft, calculate and optimize Dark Age of Camelot character templates.
            Live cap tracking, spellcraft assistance, full Eden item database.
          </p>
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
                  onClick={() => { setRealm(r.realm); setClassName(null); }}
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

          <h2 className="font-display text-xl mb-1">2. Choose your class <span className="text-sm text-muted-foreground font-body">(optional)</span></h2>
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
