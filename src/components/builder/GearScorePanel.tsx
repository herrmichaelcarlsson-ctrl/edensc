import type { AggregateResult } from "@/lib/daoc/aggregate";
import { calcGearScore } from "@/lib/daoc/formulas";
import { cn } from "@/lib/utils";

/**
 * GearScore breakdown panel:
 *   Utility + ToA + Charges − Waste = GearScore
 * Numbers come from src/lib/daoc/formulas.ts (DEFAULT_FORMULAS).
 */
export function GearScorePanel({ agg }: { agg: AggregateResult }) {
  const score = calcGearScore(agg);

  return (
    <div>
      <h3 className="text-[10px] uppercase tracking-widest text-muted-foreground font-display mb-2">
        Gear Score
      </h3>
      <div className="rounded-md border border-border bg-muted/20 px-3 py-2 space-y-1 text-xs font-mono">
        <Row label="Utility" value={score.utility} />
        <Row label="ToA" value={score.toa} />
        <Row label="Charges" value={score.charge} />
        <Row label="Waste" value={-score.waste} negative />
        <div className="border-t border-border/60 my-1" />
        <Row label="GearScore" value={score.total} highlight />
      </div>
    </div>
  );
}

function Row({
  label, value, highlight, negative,
}: { label: string; value: number; highlight?: boolean; negative?: boolean }) {
  return (
    <div
      className={cn(
        "flex items-center justify-between tabular-nums",
        highlight && "text-primary font-semibold text-sm pt-0.5",
        negative && "text-status-waste",
      )}
    >
      <span className={cn(!highlight && "text-foreground/70")}>{label}</span>
      <span>
        {value > 0 && !negative ? "+" : ""}
        {value.toFixed(1)}
      </span>
    </div>
  );
}