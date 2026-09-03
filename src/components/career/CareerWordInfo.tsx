import type { CareerWord } from '@/types/careerProfile';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Check, Plus } from 'lucide-react';

interface Props {
  word: CareerWord | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  selected?: boolean;
  onToggle?: () => void;
  canSelect?: boolean;
}

const Block = ({ title, children }: { title: string; children: string }) => (
  <div>
    <h4 className="text-sm font-semibold text-primary mb-1">{title}</h4>
    <p className="text-sm text-foreground/90 leading-relaxed">{children}</p>
  </div>
);

export const CareerWordInfo = ({ word, open, onOpenChange, selected, onToggle, canSelect = true }: Props) => {
  if (!word) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-popover">
        <DialogHeader>
          <DialogTitle className="text-xl">{word.label}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Block title="Vad betyder det?">{word.definition}</Block>
          <Block title="Hur kan det märkas?">{word.studentExample}</Block>
          <Block title="I arbetslivet">{word.careerContext}</Block>
          <Block title="Fundera på">{word.reflectionQuestion}</Block>
        </div>
        {onToggle && (
          <div className="pt-2">
            <Button
              onClick={onToggle}
              disabled={!selected && !canSelect}
              variant={selected ? 'secondary' : 'default'}
              className="w-full min-h-11"
            >
              {selected ? (
                <>
                  <Check className="w-4 h-4 mr-1" /> Vald – klicka för att ta bort
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-1" /> Välj {word.label.toLowerCase()}
                </>
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
