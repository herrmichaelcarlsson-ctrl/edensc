import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Database, Gem, PencilLine } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  slotLabel: string;
  onChooseItem: () => void;
  onChooseSpellcraft: () => void;
  onChooseCustom: () => void;
}

export function SlotActionDialog({
  open,
  onClose,
  slotLabel,
  onChooseItem,
  onChooseSpellcraft,
  onChooseCustom,
}: Props) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">{slotLabel}</DialogTitle>
          <DialogDescription>Choose how to fill this slot.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-2 pt-2">
          <Button type="button" variant="outline" className="h-12 justify-start gap-3" onClick={onChooseItem}>
            <Database className="h-4 w-4" />
            Pick from database
          </Button>
          <Button type="button" variant="outline" className="h-12 justify-start gap-3" onClick={onChooseSpellcraft}>
            <Gem className="h-4 w-4" />
            Spellcraft a crafted item
          </Button>
          <Button type="button" variant="outline" className="h-12 justify-start gap-3" onClick={onChooseCustom}>
            <PencilLine className="h-4 w-4" />
            Add custom item
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}