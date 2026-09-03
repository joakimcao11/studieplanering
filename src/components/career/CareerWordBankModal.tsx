import { useMemo, useState } from 'react';
import type { CareerCategoryDef, CareerWord, CategorySelection } from '@/types/careerProfile';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Info, Search, Check, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CareerWordInfo } from './CareerWordInfo';
import { useIsMobile } from '@/hooks/use-mobile';

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  def: CareerCategoryDef;
  selection: CategorySelection;
  onToggle: (label: string) => void;
  onAddCustom: (label: string) => void;
}

const WordBankBody = ({ def, selection, onToggle, onAddCustom }: Omit<Props, 'open' | 'onOpenChange'>) => {
  const [query, setQuery] = useState('');
  const [infoWord, setInfoWord] = useState<CareerWord | null>(null);
  const [customValue, setCustomValue] = useState('');
  const [showCustom, setShowCustom] = useState(false);

  const total = selection.selectedItems.length + selection.customItems.length;
  const full = total >= selection.maxSelections;

  const words = useMemo(() => {
    const sorted = [...def.words].sort((a, b) => a.label.localeCompare(b.label, 'sv'));
    const q = query.trim().toLowerCase();
    return q ? sorted.filter((w) => w.label.toLowerCase().includes(q)) : sorted;
  }, [def.words, query]);

  const addCustom = () => {
    if (!customValue.trim() || full) return;
    onAddCustom(customValue);
    setCustomValue('');
  };

  return (
    <div className="flex flex-col min-h-0 flex-1">
      <div className="px-1 pb-3 space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Sök bland ord…"
            aria-label={`Sök bland ord i ${def.title}`}
            className="pl-9 h-11"
          />
        </div>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <p className={cn('text-sm font-medium', full ? 'text-accent-foreground' : 'text-muted-foreground')}>
            {total} av {selection.maxSelections} valda
          </p>
          {full && (
            <p className="text-sm text-muted-foreground">
              Du har valt åtta. Vill du välja något annat behöver du först ta bort ett av dina nuvarande val.
            </p>
          )}
        </div>
      </div>

      <ScrollArea className="flex-1 min-h-0 pr-2">
        <ul className="grid sm:grid-cols-2 gap-2 pb-4">
          {words.map((w) => {
            const selected = selection.selectedItems.includes(w.label);
            return (
              <li key={w.id} className="flex items-stretch gap-1">
                <button
                  type="button"
                  onClick={() => onToggle(w.label)}
                  disabled={!selected && full}
                  aria-pressed={selected}
                  className={cn(
                    'flex-1 min-h-11 text-left px-3 py-2 rounded-lg border text-sm transition-colors flex items-center gap-2',
                    selected
                      ? 'border-primary bg-primary/10 text-foreground font-medium'
                      : 'border-border bg-card hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed',
                  )}
                >
                  <span
                    className={cn(
                      'w-4 h-4 rounded border flex items-center justify-center shrink-0',
                      selected ? 'bg-primary border-primary' : 'border-muted-foreground/50',
                    )}
                    aria-hidden
                  >
                    {selected && <Check className="w-3 h-3 text-primary-foreground" />}
                  </span>
                  {w.label}
                </button>
                <button
                  type="button"
                  onClick={() => setInfoWord(w)}
                  aria-label={`Läs förklaring av ${w.label}`}
                  className="w-11 min-h-11 rounded-lg border border-border text-muted-foreground hover:text-primary hover:border-primary flex items-center justify-center shrink-0"
                >
                  <Info className="w-4 h-4" />
                </button>
              </li>
            );
          })}
          {words.length === 0 && (
            <li className="text-sm text-muted-foreground py-6">Inga ord matchar din sökning.</li>
          )}
        </ul>
      </ScrollArea>

      <div className="border-t pt-3 mt-1">
        {!showCustom ? (
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <p className="text-sm text-muted-foreground">Hittar du inte rätt ord?</p>
            <Button variant="outline" className="min-h-11" onClick={() => setShowCustom(true)} disabled={full}>
              <Plus className="w-4 h-4 mr-1" /> Lägg till eget ord
            </Button>
          </div>
        ) : (
          <div className="flex gap-2">
            <Input
              autoFocus
              value={customValue}
              onChange={(e) => setCustomValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addCustom()}
              placeholder="Skriv ditt eget ord eller din egen formulering"
              aria-label="Eget ord"
              className="h-11"
            />
            <Button className="min-h-11" onClick={addCustom} disabled={full || !customValue.trim()}>
              Lägg till
            </Button>
          </div>
        )}
      </div>

      <CareerWordInfo
        word={infoWord}
        open={!!infoWord}
        onOpenChange={(o) => !o && setInfoWord(null)}
        selected={infoWord ? selection.selectedItems.includes(infoWord.label) : false}
        canSelect={!full}
        onToggle={() => {
          if (infoWord) onToggle(infoWord.label);
        }}
      />
    </div>
  );
};

export const CareerWordBankModal = ({ open, onOpenChange, ...rest }: Props) => {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="h-[92vh] flex flex-col px-4 pb-4">
          <DrawerHeader className="px-0">
            <DrawerTitle>{rest.def.title}</DrawerTitle>
            <DrawerDescription>{rest.def.question}</DrawerDescription>
          </DrawerHeader>
          <WordBankBody {...rest} />
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl w-[min(880px,92vw)] h-[80vh] flex flex-col bg-popover">
        <DialogHeader>
          <DialogTitle>{rest.def.title}</DialogTitle>
          <DialogDescription>{rest.def.question}</DialogDescription>
        </DialogHeader>
        <WordBankBody {...rest} />
      </DialogContent>
    </Dialog>
  );
};
