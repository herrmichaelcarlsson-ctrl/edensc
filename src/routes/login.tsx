import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — Eden Template Forge" },
      { name: "description", content: "Sign in to publish, vote and save your DAoC templates." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { signIn, signUp, resetPassword } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup" | "reset">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signin") {
        const r = await signIn(email, password);
        if (r.error) toast.error(r.error);
        else { toast.success("Welcome back"); navigate({ to: "/" }); }
      } else if (mode === "signup") {
        const r = await signUp(email, password, displayName || email.split("@")[0]);
        if (r.error) toast.error(r.error);
        else { toast.success("Account created — you're signed in"); navigate({ to: "/" }); }
      } else {
        const r = await resetPassword(email);
        if (r.error) toast.error(r.error);
        else toast.success("Password reset email sent");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <Toaster richColors position="bottom-right" />
      <Card className="w-full max-w-md p-7 bg-card/85 backdrop-blur border-border">
        <Link to="/" className="text-xs text-muted-foreground hover:text-primary">← Home</Link>
        <h1 className="font-display text-2xl text-primary mt-3 mb-1">
          {mode === "signin" ? "Sign in" : mode === "signup" ? "Create account" : "Reset password"}
        </h1>
        <p className="text-sm text-muted-foreground mb-6">
          {mode === "signin" && "Sign in to publish and vote on templates."}
          {mode === "signup" && "Free account — used for ownership of templates and items."}
          {mode === "reset" && "We'll email you a reset link."}
        </p>
        <form onSubmit={onSubmit} className="space-y-3">
          {mode === "signup" && (
            <div className="space-y-1.5">
              <Label htmlFor="name">Display name</Label>
              <Input id="name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Your in-game name" />
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          {mode !== "reset" && (
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" required minLength={8}
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
          )}
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? "Working…" : mode === "signin" ? "Sign in" : mode === "signup" ? "Create account" : "Send reset link"}
          </Button>
        </form>
        <div className="mt-5 text-xs text-center text-muted-foreground space-x-3">
          {mode !== "signin" && <button onClick={() => setMode("signin")} className="hover:text-primary">Sign in</button>}
          {mode !== "signup" && <button onClick={() => setMode("signup")} className="hover:text-primary">Create account</button>}
          {mode !== "reset" && <button onClick={() => setMode("reset")} className="hover:text-primary">Forgot password?</button>}
        </div>
      </Card>
    </div>
  );
}
