import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import type { ItemEffect } from "@/lib/daoc/types";

interface Props {
  open: boolean;
  onClose: () => void;
  slotLabel: string;
  defaultName: string;
  onSave: (name: string, effects: ItemEffect[]) => void;
}

/**
 * Stat / resist / vital effect IDs the user can pick when describing a
 * drop, artifact or any non-craftable item by hand.
 */
const EFFECT_OPTIONS: { id: string; label: string; group: string; suffix?: string }[] = [
  // Stats
  { id: "STRENGTH", label: "Strength", group: "Stats" },
  { id: "CONSTITUTION", label: "Constitution", group: "Stats" },
  { id: "DEXTERITY", label: "Dexterity", group: "Stats" },
  { id: "QUICKNESS", label: "Quickness", group: "Stats" },
  { id: "ACUITY", label: "Acuity", group: "Stats" },
  { id: "PIETY", label: "Piety", group: "Stats" },
  { id: "EMPATHY", label: "Empathy", group: "Stats" },
  { id: "CHARISMA", label: "Charisma", group: "Stats" },
  { id: "INTELLIGENCE", label: "Intelligence", group: "Stats" },
  // Stat caps
  { id: "CAP_STRENGTH", label: "Strength Cap", group: "Stat caps" },
  { id: "CAP_CONSTITUTION", label: "Constitution Cap", group: "Stat caps" },
  { id: "CAP_DEXTERITY", label: "Dexterity Cap", group: "Stat caps" },
  { id: "CAP_QUICKNESS", label: "Quickness Cap", group: "Stat caps" },
  { id: "CAP_ACUITY", label: "Acuity Cap", group: "Stat caps" },
  // Vital
  { id: "HITPOINTS", label: "Hit Points", group: "Vital" },
  { id: "POWER_POOL", label: "Power %", group: "Vital", suffix: "%" },
  { id: "CAP_HITPOINTS", label: "HP Cap", group: "Vital" },
  // Resists
  { id: "RES_CRUSH", label: "Crush Resist", group: "Resists", suffix: "%" },
  { id: "RES_SLASH", label: "Slash Resist", group: "Resists", suffix: "%" },
  { id: "RES_THRUST", label: "Thrust Resist", group: "Resists", suffix: "%" },
  { id: "RES_HEAT", label: "Heat Resist", group: "Resists", suffix: "%" },
  { id: "RES_COLD", label: "Cold Resist", group: "Resists", suffix: "%" },
  { id: "RES_MATTER", label: "Matter Resist", group: "Resists", suffix: "%" },
  { id: "RES_BODY", label: "Body Resist", group: "Resists", suffix: "%" },
  { id: "RES_SPIRIT", label: "Spirit Resist", group: "Resists", suffix: "%" },
  { id: "RES_ENERGY", label: "Energy Resist", group: "Resists", suffix: "%" },
];

const MAX_EFFECTS = 10;

export function CustomItemDialog({ open, onClose, slotLabel, defaultName, onSave }: Props) {
  const [name, setName] = useState(defaultName);
  const [effects, setEffects] = useState<ItemEffect[]>([]);

  useEffect(() => {
    if (open) {
      setName(defaultName);
      setEffects([]);
    }
  }, [open, defaultName]);

  const groups = useMemo(() => {
    const by = new Map<string, typeof EFFECT_OPTIONS>();
    for (const e of EFFECT_OPTIONS) {
      const arr = by.get(e.group) ?? [];
      arr.push(e);
      by.set(e.group, arr);
    }
    return Array.from(by.entries());
  }, []);

  function addEffect() {
    if (effects.length >= MAX_EFFECTS) return;
    setEffects((arr) => [...arr, { id: "STRENGTH", value: 1 }]);
  }
  function updateEffect(idx: number, patch: Partial<ItemEffect>) {
    setEffects((arr) => arr.map((e, i) => (i === idx ? { ...e, ...patch } : e)));
  }
  function removeEffect(idx: number) {
    setEffects((arr) => arr.filter((_, i) => i !== idx));
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-display">Custom item</DialogTitle>
          <DialogDescription>
            {slotLabel} — enter the bonuses manually. Spellcraft is disabled on custom items.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Name</label>
            <Input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder={`Custom ${slotLabel}`} />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Bonuses ({effects.length}/{MAX_EFFECTS})
              </label>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={addEffect}
                disabled={effects.length >= MAX_EFFECTS}
                className="h-7"
              >
                <Plus className="h-3.5 w-3.5 mr-1" /> Add bonus
              </Button>
            </div>

            {effects.length === 0 ? (
              <div className="rounded border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                No bonuses yet. Click "Add bonus" to start.
              </div>
            ) : (
              <div className="space-y-1.5 max-h-[40vh] overflow-y-auto pr-1">
                {effects.map((eff, idx) => {
                  const def = EFFECT_OPTIONS.find((e) => e.id === eff.id);
                  return (
                    <div key={idx} className="grid grid-cols-[1fr_90px_auto] gap-2 items-center">
                      <Select
                        value={eff.id}
                        onValueChange={(v) => updateEffect(idx, { id: v })}
                      >
                        <SelectTrigger className="h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {groups.map(([groupName, opts]) => (
                            <div key={groupName}>
                              <div className="px-2 py-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                                {groupName}
                              </div>
                              {opts.map((o) => (
                                <SelectItem key={o.id} value={o.id} className="text-xs">
                                  {o.label}
                                </SelectItem>
                              ))}
                            </div>
                          ))}
                        </SelectContent>
                      </Select>
                      <div className="relative">
                        <Input
                          type="number"
                          value={eff.value}
                          onChange={(e) => updateEffect(idx, { value: parseInt(e.target.value, 10) || 0 })}
                          className="h-8 text-xs pr-6"
                        />
                        {def?.suffix && (
                          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">
                            {def.suffix}
                          </span>
                        )}
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => removeEffect(idx)}
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button type="button" variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
            <Button
              type="button"
              size="sm"
              onClick={() => onSave(name.trim() || defaultName, effects.filter((e) => e.value !== 0))}
            >
              Save item
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}