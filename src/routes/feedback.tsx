import { createFileRoute, Link } from "@tanstack/react-router";
import { FeatureRequestsBoard } from "@/components/feature-requests/FeatureRequestsBoard";
import { Toaster } from "@/components/ui/sonner";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/feedback")({
  head: () => ({
    meta: [
      { title: "Önskemål — Eden Template Forge" },
      { name: "description", content: "Skicka in önskemål och rösta på funktioner till Eden Template Forge." },
      { property: "og:title", content: "Önskemål — Eden Template Forge" },
      { property: "og:description", content: "Skicka in önskemål och rösta på funktioner." },
    ],
  }),
  component: FeedbackPage,
});

function FeedbackPage() {
  return (
    <div className="min-h-screen">
      <Toaster richColors position="bottom-right" />
      <header className="border-b border-border bg-background/85 backdrop-blur">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link to="/" className="text-muted-foreground hover:text-primary">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h1 className="font-display text-xl">Önskemål & röster</h1>
        </div>
      </header>
      <main className="max-w-3xl mx-auto px-4 py-8">
        <p className="text-sm text-muted-foreground mb-6">
          Skicka in vad du vill se i Eden Template Forge och rösta på det andra föreslagit.
          Önskemål med flest röster prioriteras först.
        </p>
        <FeatureRequestsBoard />
      </main>
    </div>
  );
}