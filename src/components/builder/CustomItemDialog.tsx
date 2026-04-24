import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Props {
  open: boolean;
  onClose: () => void;
  slotLabel: string;
  defaultName: string;
  onSave: (name: string) => void;
}

export function CustomItemDialog({ open, onClose, slotLabel, defaultName, onSave }: Props) {
  const [name, setName] = useState(defaultName);

  useEffect(() => {
    if (open) setName(defaultName);
  }, [open, defaultName]);

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Eget item</DialogTitle>
          <DialogDescription>{slotLabel}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3 pt-2">
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase tracking-wider text-muted-foreground">Namn</label>
            <Input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder={`Custom ${slotLabel}`} />
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" size="sm" onClick={onClose}>Avbryt</Button>
            <Button
              type="button"
              size="sm"
              onClick={() => onSave(name.trim() || defaultName)}
            >
              Spara
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}