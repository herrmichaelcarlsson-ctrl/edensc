import type { AggregateResult } from "@/lib/daoc/aggregate";
import { detectResistHoles } from "@/lib/daoc/formulas";
import { ShieldAlert } from "lucide-react";

export function ResistHolePanel({ agg }: { agg: AggregateResult }) {
  const holes = detectResistHoles(agg);
  if (holes.length === 0) {
    return (
      <div className="text-xs text-status-capped flex items-center gap-1.5">
        <ShieldAlert className="h-3.5 w-3.5" /> All resists are capped.
      </div>
    );
  }
  return (
    <div>
      <h3 className="text-[10px] uppercase tracking-widest text-muted-foreground font-display mb-2">
        Resist Holes
      </h3>
      <ul className="space-y-0.5">
        {holes.map((h) => (
          <li
            key={h.key}
            className="flex items-center justify-between text-xs tabular-nums"
          >
            <span className="text-foreground/80">{h.label}</span>
            <span className="text-status-missing">
              {h.current}/{h.cap}{" "}
              <span className="text-muted-foreground">(−{h.missing})</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}