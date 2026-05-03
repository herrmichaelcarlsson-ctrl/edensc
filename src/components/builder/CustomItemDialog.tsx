import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import type { ItemEffect } from "@/lib/daoc/types";
import { EFFECT_OPTIONS, EFFECT_GROUPS, effectById, type EffectGroup } from "@/lib/daoc/effect-catalog";

interface Props {
  open: boolean;
  onClose: () => void;
  slotLabel: string;
  defaultName: string;
  onSave: (name: string, effects: ItemEffect[]) => void;
}

const MAX_EFFECTS = 10;

export function CustomItemDialog({ open, onClose, slotLabel, defaultName, onSave }: Props) {
  const [name, setName] = useState(defaultName);
  const [effects, setEffects] = useState<ItemEffect[]>([]);
  const [groups, setGroups] = useState<EffectGroup[]>([]);

  useEffect(() => {
    if (open) {
      setName(defaultName);
      setEffects([]);
      setGroups([]);
    }
  }, [open, defaultName]);

  function addEffect() {
    if (effects.length >= MAX_EFFECTS) return;
    setEffects((arr) => [...arr, { id: "STRENGTH", value: 1 }]);
    setGroups((arr) => [...arr, "Stats"]);
  }
  function updateEffect(idx: number, patch: Partial<ItemEffect>) {
    setEffects((arr) => arr.map((e, i) => (i === idx ? { ...e, ...patch } : e)));
  }
  function removeEffect(idx: number) {
    setEffects((arr) => arr.filter((_, i) => i !== idx));
    setGroups((arr) => arr.filter((_, i) => i !== idx));
  }
  function changeGroup(idx: number, group: EffectGroup) {
    const first = EFFECT_OPTIONS.find((e) => e.group === group);
    setGroups((arr) => arr.map((g, i) => (i === idx ? group : g)));
    if (first) updateEffect(idx, { id: first.id });
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
                  const def = effectById(eff.id);
                  const group = groups[idx] ?? def?.group ?? "Stats";
                  const opts = EFFECT_OPTIONS.filter((o) => o.group === group);
                  return (
                    <div key={idx} className="grid grid-cols-[1fr_1.4fr_90px_auto] gap-2 items-center">
                      <Select value={group} onValueChange={(v) => changeGroup(idx, v as EffectGroup)}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {EFFECT_GROUPS.map((g) => (
                            <SelectItem key={g} value={g} className="text-xs">{g}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={eff.id} onValueChange={(v) => updateEffect(idx, { id: v })}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {opts.map((o) => (
                            <SelectItem key={o.id} value={o.id} className="text-xs">{o.label}</SelectItem>
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