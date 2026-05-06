import type { AggregateResult, AggregatedStat } from "@/lib/daoc/aggregate";
import { cn } from "@/lib/utils";
import { CLASS_ACUITY } from "@/lib/daoc/classes";

function StatRow({ s }: { s: AggregatedStat }) {
  const showCap = s.effectiveCap;
  const pct = Math.min(100, (s.current / Math.max(showCap, 1)) * 100);
  const colorClass =
    s.status === "capped" ? "bg-status-capped" :
    s.status === "near" ? "bg-status-near" :
    s.status === "waste" ? "bg-status-waste" :
    s.status === "missing" && s.current > 0 ? "bg-status-missing/60" :
    "bg-muted-foreground/30";
  const textClass =
    s.status === "capped" ? "text-status-capped" :
    s.status === "near" ? "text-status-near" :
    s.status === "waste" ? "text-status-waste" :
    s.status === "missing" && s.current > 0 ? "text-status-missing" :
    "text-muted-foreground";

  return (
    <div className="grid grid-cols-[1fr_auto] gap-x-3 items-center py-1">
      <div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-foreground/90">{s.label}</span>
          <span className={cn("font-mono tabular-nums", textClass)}>
            {s.current} / {showCap}
            {s.waste > 0 && <span className="ml-1 text-status-waste">(+{s.waste})</span>}
          </span>
        </div>
        <div className="mt-1 h-1 rounded-full bg-muted overflow-hidden">
          <div className={cn("h-full transition-all", colorClass)} style={{ width: `${pct}%` }} />
        </div>
      </div>
    </div>
  );
}

function Section({ title, stats }: { title: string; stats: AggregatedStat[] }) {
  const visible = stats.filter((s) => s.current > 0 || s.group === "resist" || s.group === "stat");
  if (visible.length === 0) return null;
  return (
    <div>
      <h3 className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5 font-display">
        {title}
      </h3>
      <div className="space-y-0.5">
        {visible.map((s) => <StatRow key={s.key} s={s} />)}
      </div>
    </div>
  );
}

export function StatsPanel({ agg, className }: { agg: AggregateResult; className?: string | null }) {
  // Hide the duplicate "Acuity" row and rename the class-relevant casting stat
  // (Intelligence / Piety / Empathy / Charisma) to "Acuity (X)".
  const acuityKey = className ? CLASS_ACUITY[className] : null;
  const stats = agg.stats
    .filter((s) => !(acuityKey && s.key === "ACUITY"))
    .map((s) => (acuityKey && s.key === acuityKey ? { ...s, label: `Acuity (${s.label})` } : s));
  const primaryStats = stats.filter((s) => s.group === "stat");
  const vital = stats.filter((s) => s.group === "vital");
  const resists = stats.filter((s) => s.group === "resist");
  const bonuses = stats.filter((s) => s.group === "bonus");

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg">Character Summary</h2>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Score</span>
          <span className={cn(
            "font-display text-2xl tabular-nums",
            agg.score >= 80 ? "text-status-capped" :
            agg.score >= 50 ? "text-status-near" : "text-status-missing",
          )}>{agg.score}</span>
        </div>
      </div>

      <Section title="Stats" stats={primaryStats} />
      <Section title="Vital" stats={vital} />
      <Section title="Resists" stats={resists} />
      <Section title="Bonuses" stats={bonuses} />

      {agg.skills.length > 0 && (
        <div>
          <h3 className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1.5 font-display">
            Skills
          </h3>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
            {agg.skills.map((s) => (
              <div key={s.id} className="flex items-center justify-between">
                <span className="text-foreground/80 truncate">{s.id.replace(/_/g, " ")}</span>
                <span className="font-mono text-status-capped">+{s.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="pt-3 border-t border-border/60 grid grid-cols-2 gap-2 text-[10px] text-muted-foreground">
        <Legend color="bg-status-capped" label="Capped" />
        <Legend color="bg-status-near" label="Near cap" />
        <Legend color="bg-status-missing" label="Missing" />
        <Legend color="bg-status-waste" label="Waste / Overcap" />
      </div>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={cn("h-2 w-2 rounded-full", color)} />
      <span>{label}</span>
    </div>
  );
}