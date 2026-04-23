import { AlertTriangle, Sparkles } from "lucide-react";
import type { SuggestionResult } from "@/lib/daoc/suggest";

interface Props {
  result: SuggestionResult;
  totalGemSlots: number;
  totalGemUsed: number;
}

export function SuggestionsPanel({ result, totalGemSlots, totalGemUsed }: Props) {
  const remaining = Math.max(0, totalGemSlots - totalGemUsed);
  const overflow = result.gemsNeeded > remaining;

  if (result.entries.length === 0) {
    return (
      <div className="text-xs text-status-capped flex items-center gap-1.5">
        <Sparkles className="h-3.5 w-3.5" /> Alla stats & resists är cappade!
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-[10px] uppercase tracking-widest text-muted-foreground font-display">
          Saknas — gem-förslag
        </h3>
        <span className="text-[10px] tabular-nums text-muted-foreground">
          {result.gemsNeeded} gems · {totalGemUsed}/{totalGemSlots} slots
        </span>
      </div>

      {overflow && (
        <div className="flex items-start gap-1.5 text-[11px] text-status-waste rounded border border-status-waste/30 bg-status-waste/5 p-2">
          <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
          <span>Du saknar fler stats än vad lediga gem-slots kan lösa ({result.gemsNeeded} behövs, {remaining} kvar). Lägg till fler craftbara items.</span>
        </div>
      )}

      <ul className="space-y-1">
        {result.entries.slice(0, 10).map((e) => (
          <li key={e.effectId} className="text-xs flex items-center justify-between gap-2 py-0.5">
            <span className="text-foreground/80 truncate">{e.label}</span>
            <span className="flex items-center gap-2 shrink-0">
              <span className="text-status-missing tabular-nums">−{e.missing}</span>
              {e.suggestion && (
                <span className="text-[10px] text-muted-foreground">→ {e.suggestion.label} ({e.suggestion.cost}p)</span>
              )}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
