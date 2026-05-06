import { useState, useMemo } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wand2, X } from "lucide-react";
import { CAPS } from "@/lib/daoc/caps";
import type { CapTarget } from "@/lib/daoc/autocraft";
import { CLASS_ACUITY } from "@/lib/daoc/classes";

/** Effect IDs the user can target. Stats + resists + key vitals. */
const TARGETABLE: { key: string; group: string }[] = Object.entries(CAPS)
  .filter(([, def]) => def.group === "stat" || def.group === "resist" || def.kind === "hp" || def.kind === "power")
  .map(([key, def]) => ({ key, group: def.group }));

const PRESETS: { name: string; targets: CapTarget }[] = [
  { name: "Tank — 101 STR/CON/QUI, capped resists",
    targets: { STRENGTH: 101, CONSTITUTION: 101, QUICKNESS: 101, HITPOINTS: 400,
      RES_CRUSH: 26, RES_SLASH: 26, RES_THRUST: 26, RES_HEAT: 26, RES_COLD: 26,
      RES_MATTER: 26, RES_BODY: 26, RES_SPIRIT: 26, RES_ENERGY: 26 } },
  { name: "Caster — 101 ACU/DEX, capped resists",
    targets: { DEXTERITY: 101, INTELLIGENCE: 101, PIETY: 101, EMPATHY: 101, HITPOINTS: 400,
      POWER: 26,
      RES_CRUSH: 26, RES_SLASH: 26, RES_THRUST: 26, RES_HEAT: 26, RES_COLD: 26,
      RES_MATTER: 26, RES_BODY: 26, RES_SPIRIT: 26, RES_ENERGY: 26 } },
  { name: "Stealth — 101 DEX/QUI/STR, capped resists",
    targets: { DEXTERITY: 101, QUICKNESS: 101, STRENGTH: 101, CONSTITUTION: 101, HITPOINTS: 400,
      RES_CRUSH: 26, RES_SLASH: 26, RES_THRUST: 26, RES_HEAT: 26, RES_COLD: 26,
      RES_MATTER: 26, RES_BODY: 26, RES_SPIRIT: 26, RES_ENERGY: 26 } },
];

interface Props {
  open: boolean;
  onClose: () => void;
  targets: CapTarget;
  onChange: (targets: CapTarget) => void;
  onRun: () => void;
  className?: string | null;
}

export function AutocraftDialog({ open, onClose, targets, onChange, onRun, className }: Props) {
  const [draft, setDraft] = useState<CapTarget>(targets);

  // Re-sync if parent targets change (e.g. after preset apply).
  useMemo(() => setDraft(targets), [targets, open]);

  // Hide the duplicate stat row for the wrong "Acuity" alias for this class.
  const acuityKey = className ? CLASS_ACUITY[className] : null;
  const stats = TARGETABLE.filter((t) => t.group === "stat" && t.key !== "ACUITY");
  const vitals = TARGETABLE.filter((t) => t.key === "HITPOINTS" || t.key === "POWER");
  const resists = TARGETABLE.filter((t) => t.group === "resist");

  function setTarget(key: string, raw: string) {
    const v = parseInt(raw, 10);
    setDraft((d) => {
      const n = { ...d };
      if (!Number.isFinite(v) || v <= 0) delete n[key];
      else n[key] = v;
      return n;
    });
  }

  function applyAndRun() {
    onChange(draft);
    onRun();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <Wand2 className="h-4 w-4" /> Autocraft target caps
          </DialogTitle>
          <DialogDescription>
            Set the values you want to hit (e.g. 101 Dex, 26 Heat). The autocrafter will
            fill every spellcraftable item with the best gems within the safe imbue limit.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-wrap gap-1.5">
          {PRESETS.map((p) => (
            <Button key={p.name} size="sm" variant="outline" className="h-7 text-xs"
              onClick={() => setDraft(p.targets)}>
              {p.name}
            </Button>
          ))}
          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setDraft({})}>
            <X className="h-3 w-3 mr-1" /> Clear
          </Button>
        </div>

        <div className="grid md:grid-cols-3 gap-4 max-h-[55vh] overflow-y-auto">
          <Group title="Stats" items={stats} acuityKey={acuityKey} draft={draft} onSet={setTarget} />
          <Group title="Resists" items={resists} acuityKey={null} draft={draft} onSet={setTarget} />
          <Group title="Vital" items={vitals} acuityKey={null} draft={draft} onSet={setTarget} />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button size="sm" onClick={applyAndRun}>
            <Wand2 className="h-4 w-4 mr-1.5" /> Run autocraft
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Group({
  title, items, draft, onSet, acuityKey,
}: {
  title: string;
  items: { key: string; group: string }[];
  draft: CapTarget;
  onSet: (key: string, raw: string) => void;
  acuityKey: string | null;
}) {
  return (
    <div>
      <h3 className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2 font-display">
        {title}
      </h3>
      <div className="space-y-1.5">
        {items.map((t) => {
          const def = CAPS[t.key];
          const label = acuityKey === t.key ? `${def.label} (Acuity)` : def.label;
          return (
            <div key={t.key} className="grid grid-cols-[1fr_72px] items-center gap-2">
              <Label className="text-xs">{label}</Label>
              <Input
                type="number"
                inputMode="numeric"
                placeholder={String(def.hardCap ?? def.itemCap)}
                value={draft[t.key] ?? ""}
                onChange={(e) => onSet(t.key, e.target.value)}
                className="h-7 text-xs tabular-nums"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}