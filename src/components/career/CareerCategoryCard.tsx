import { useState } from 'react';
import type { CareerCategoryDef, CategorySelection } from '@/types/careerProfile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { X, Plus, Sparkles, Pencil, Info, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CareerWordBankModal } from './CareerWordBankModal';
import { CareerWordInfo } from './CareerWordInfo';
import { careerColor } from './careerTheme';
import { wordByLabel } from '@/data/careerWordBank';

interface Props {
  def?: CareerCategoryDef;
  selection: CategorySelection;
  onToggle: (label: string) => void;
  onAddCustom: (label: string) => void;
  onUpdateCustom: (oldLabel: string, newLabel: string) => void;
  onRemove: (label: string) => void;
  onUpdateCategory: (patch: Partial<CategorySelection>) => void;
  onDeleteCategory?: () => void;
}

export const CareerCategoryCard = ({
  def,
  selection,
  onToggle,
  onAddCustom,
  onUpdateCustom,
  onRemove,
  onUpdateCategory,
  onDeleteCategory,
}: Props) => {
  const [bankOpen, setBankOpen] = useState(false);
  const [customValue, setCustomValue] = useState('');
  const [editing, setEditing] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [infoLabel, setInfoLabel] = useState<string | null>(null);
  const [showTopThree, setShowTopThree] = useState(false);

  const items = [...selection.selectedItems, ...selection.customItems];
  const total = items.length;
  const full = total >= selection.maxSelections;
  const color = careerColor(selection.colorIndex ?? 0);
  const infoWord = infoLabel ? wordByLabel(selection.id, infoLabel) ?? null : null;

  const addCustom = () => {
    if (!customValue.trim() || full) return;
    onAddCustom(customValue);
    setCustomValue('');
  };

  const toggleTop = (label: string) => {
    const top = selection.topThree || [];
    if (top.includes(label)) onUpdateCategory({ topThree: top.filter((l) => l !== label) });
    else if (top.length < 3) onUpdateCategory({ topThree: [...top, label] });
  };

  return (
    <section className="rounded-xl border bg-card shadow-sm overflow-hidden">
      <div className="h-1.5 w-full" style={{ backgroundColor: color }} aria-hidden />
      <div className="p-5 space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-bold">{selection.title}</h3>
            {(def?.question || selection.question) && (
              <p className="text-sm text-foreground/80 mt-1">{def?.question || selection.question}</p>
            )}
            {def?.helpText && <p className="text-xs text-muted-foreground mt-1.5">{def.helpText}</p>}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
              {total} av {selection.maxSelections} valda
            </span>
            {onDeleteCategory && (
              <button
                type="button"
                onClick={onDeleteCategory}
                aria-label={`Ta bort området ${selection.title}`}
                className="w-9 h-9 rounded-md text-muted-foreground hover:text-destructive flex items-center justify-center"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {items.length > 0 && (
          <ul className="flex flex-wrap gap-2">
            {items.map((label) => {
              const isCustom = selection.customItems.includes(label);
              const isTop = (selection.topThree || []).includes(label);
              return (
                <li key={label}>
                  {editing === label ? (
                    <span className="inline-flex items-center gap-1">
                      <Input
                        autoFocus
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            onUpdateCustom(label, editValue);
                            setEditing(null);
                          }
                        }}
                        className="h-9 w-56"
                        aria-label={`Redigera ${label}`}
                      />
                      <Button
                        size="sm"
                        onClick={() => {
                          onUpdateCustom(label, editValue);
                          setEditing(null);
                        }}
                      >
                        Spara
                      </Button>
                    </span>
                  ) : (
                    <span
                      className={cn(
                        'inline-flex items-center gap-1 rounded-full border pl-3 pr-1 py-1 text-sm bg-card',
                        isTop && 'ring-2 ring-offset-1',
                      )}
                      style={{ borderColor: color, ...(isTop ? { boxShadow: `0 0 0 2px ${color}` } : {}) }}
                    >
                      {isTop && <span className="text-xs font-semibold text-muted-foreground">★</span>}
                      {label}
                      {!isCustom && wordByLabel(selection.id, label) && (
                        <button
                          type="button"
                          onClick={() => setInfoLabel(label)}
                          aria-label={`Läs förklaring av ${label}`}
                          className="w-7 h-7 rounded-full hover:bg-muted flex items-center justify-center text-muted-foreground"
                        >
                          <Info className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {isCustom && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditing(label);
                            setEditValue(label);
                          }}
                          aria-label={`Redigera ${label}`}
                          className="w-7 h-7 rounded-full hover:bg-muted flex items-center justify-center text-muted-foreground"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {showTopThree && (
                        <button
                          type="button"
                          onClick={() => toggleTop(label)}
                          aria-label={`Markera ${label} som en av tre viktigaste`}
                          className="w-7 h-7 rounded-full hover:bg-muted flex items-center justify-center text-muted-foreground"
                        >
                          ★
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => onRemove(label)}
                        aria-label={`Ta bort ${label}`}
                        className="w-7 h-7 rounded-full hover:bg-muted flex items-center justify-center text-muted-foreground"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </span>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        {full && (
          <p className="text-sm text-muted-foreground bg-muted/60 border rounded-lg px-3 py-2">
            Du har valt åtta. Vill du välja något annat behöver du först ta bort ett av dina nuvarande val.
          </p>
        )}

        <div className="flex flex-wrap items-center gap-2">
          {def && (
            <Button variant="outline" className="min-h-11" onClick={() => setBankOpen(true)}>
              <Sparkles className="w-4 h-4 mr-1" /> {def.exploreLabel}
            </Button>
          )}
          <div className="flex gap-2 flex-1 min-w-[240px]">
            <Input
              value={customValue}
              onChange={(e) => setCustomValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addCustom()}
              placeholder="Skriv ditt eget ord eller din egen formulering"
              aria-label={`Eget ord i ${selection.title}`}
              className="h-11"
              disabled={full}
            />
            <Button variant="secondary" className="min-h-11" onClick={addCustom} disabled={full || !customValue.trim()}>
              <Plus className="w-4 h-4" /> <span className="sr-only">Lägg till eget ord</span>
            </Button>
          </div>
        </div>

        {items.length > 3 && (
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowTopThree((v) => !v)}
              className="text-sm text-primary underline underline-offset-4"
            >
              {showTopThree ? 'Dölj frågan' : 'Om du bara fick behålla tre – vilka skulle vara allra viktigast?'}
            </button>
            {showTopThree && (
              <p className="text-xs text-muted-foreground mt-1">
                Markera upp till tre med ★. Dina övriga val påverkas inte.
              </p>
            )}
          </div>
        )}

        <Textarea
          value={selection.note || ''}
          onChange={(e) => onUpdateCategory({ note: e.target.value })}
          placeholder="Egen anteckning om det här området (frivilligt)"
          aria-label={`Anteckning om ${selection.title}`}
          className="min-h-[64px]"
        />
      </div>

      {def && (
        <CareerWordBankModal
          open={bankOpen}
          onOpenChange={setBankOpen}
          def={def}
          selection={selection}
          onToggle={onToggle}
          onAddCustom={onAddCustom}
        />
      )}
      <CareerWordInfo word={infoWord} open={!!infoWord} onOpenChange={(o) => !o && setInfoLabel(null)} />
    </section>
  );
};
