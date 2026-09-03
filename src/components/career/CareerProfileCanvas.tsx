import { useRef, useState } from 'react';
import type { CareerProfile, CategorySelection } from '@/types/careerProfile';
import { MindMapView } from './MindMapView';
import { OverviewCareerMap } from './OverviewCareerMap';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Network, Sparkles, LayoutGrid, RotateCcw, Trash2, Info } from 'lucide-react';
import { wordByLabel } from '@/data/careerWordBank';
import { allItems } from '@/hooks/useCareerProfile';

type Viz = CareerProfile['visualization'];

interface Props {
  profile: CareerProfile;
  onChange: (patch: Partial<CareerProfile>) => void;
  onRenameItem: (categoryId: string, oldLabel: string, newLabel: string) => void;
  onRemoveItem: (categoryId: string, label: string) => void;
  onMoveItem: (fromId: string, toId: string, label: string) => void;
  /** Ref till ytan som exporteras som bild. */
  captureRef: React.RefObject<HTMLDivElement>;
}

const VIEWS: { id: Viz['type']; label: string; icon: typeof Network }[] = [
  { id: 'mindmap', label: 'Mindmap', icon: Network },
  { id: 'creative', label: 'Kreativ', icon: Sparkles },
  { id: 'overview', label: 'Översikt', icon: LayoutGrid },
];

export const CareerProfileCanvas = ({
  profile, onChange, onRenameItem, onRemoveItem, onMoveItem, captureRef,
}: Props) => {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [editing, setEditing] = useState<{ categoryId: string; label: string } | null>(null);
  const [draftLabel, setDraftLabel] = useState('');
  const [targetCat, setTargetCat] = useState<string>('');
  const viz = profile.visualization;
  const setViz = (patch: Partial<Viz>) => onChange({ visualization: { ...viz, ...patch } });
  const active: CategorySelection[] = profile.categories.filter((c) => allItems(c).length > 0);
  const word = editing ? wordByLabel(editing.categoryId, editing.label) : undefined;
  const heightClass =
    viz.format === 'portrait' ? 'aspect-[3/4] max-h-[75vh]' : viz.format === 'square' ? 'aspect-square max-h-[75vh]' : 'aspect-[16/9] max-h-[70vh]';

  const openWord = (categoryId: string, label: string) => {
    setEditing({ categoryId, label });
    setDraftLabel(label);
    setTargetCat(categoryId);
  };

  const saveWord = () => {
    if (!editing) return;
    if (targetCat !== editing.categoryId) {
      onMoveItem(editing.categoryId, targetCat, draftLabel.trim() || editing.label);
    } else if (draftLabel.trim() && draftLabel.trim() !== editing.label) {
      onRenameItem(editing.categoryId, editing.label, draftLabel.trim());
    }
    setEditing(null);
  };

  return (
    <div className="space-y-4">
      {/* Verktygsrad */}
      <div className="flex flex-wrap items-center gap-2" data-export-hide="true">
        <div className="inline-flex rounded-md border bg-card p-1" role="group" aria-label="Välj vy">
          {VIEWS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setViz({ type: id })}
              aria-pressed={viz.type === id}
              className={`inline-flex items-center gap-1.5 rounded px-3 min-h-11 text-sm font-medium transition-colors ${
                viz.type === id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'
              }`}
            >
              <Icon className="w-4 h-4" /> {label}
            </button>
          ))}
        </div>

        <Select value={viz.layout} onValueChange={(v) => setViz({ layout: v as Viz['layout'] })}>
          <SelectTrigger className="w-[150px] h-11" aria-label="Layout"><SelectValue /></SelectTrigger>
          <SelectContent className="bg-popover z-50">
            <SelectItem value="compact">Kompakt</SelectItem>
            <SelectItem value="balanced">Balanserad</SelectItem>
            <SelectItem value="airy">Luftig</SelectItem>
          </SelectContent>
        </Select>

        <Select value={viz.display} onValueChange={(v) => setViz({ display: v as Viz['display'] })}>
          <SelectTrigger className="w-[170px] h-11" aria-label="Visa"><SelectValue /></SelectTrigger>
          <SelectContent className="bg-popover z-50">
            <SelectItem value="all">Visa alla ord</SelectItem>
            <SelectItem value="categories">Endast områden</SelectItem>
          </SelectContent>
        </Select>

        <Select value={viz.theme} onValueChange={(v) => setViz({ theme: v as Viz['theme'] })}>
          <SelectTrigger className="w-[140px] h-11" aria-label="Färgtema"><SelectValue /></SelectTrigger>
          <SelectContent className="bg-popover z-50">
            <SelectItem value="site">LTH-färger</SelectItem>
            <SelectItem value="warm">Varmt</SelectItem>
            <SelectItem value="cool">Svalt</SelectItem>
          </SelectContent>
        </Select>

        <Select value={viz.format} onValueChange={(v) => setViz({ format: v as Viz['format'] })}>
          <SelectTrigger className="w-[150px] h-11" aria-label="Format"><SelectValue /></SelectTrigger>
          <SelectContent className="bg-popover z-50">
            <SelectItem value="landscape">Liggande</SelectItem>
            <SelectItem value="portrait">Stående</SelectItem>
            <SelectItem value="square">Kvadrat</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          className="min-h-11"
          onClick={() => {
            onChange({ nodePositions: {} });
            setCollapsed({});
          }}
        >
          <RotateCcw className="w-4 h-4 mr-1" /> Återställ placering
        </Button>
      </div>

      {/* Själva ytan */}
      <div
        ref={captureRef}
        className={`w-full ${heightClass} rounded-xl border bg-card overflow-hidden`}
      >
        {viz.type === 'overview' ? (
          <OverviewCareerMap profile={profile} />
        ) : (
          <MindMapView
            profile={profile}
            variant={viz.type === 'creative' ? 'creative' : 'mindmap'}
            collapsed={collapsed}
            onToggleCollapse={(id) => setCollapsed((c) => ({ ...c, [id]: !c[id] }))}
            onSelectWord={openWord}
            onPositionsChange={(positions) => onChange({ nodePositions: positions })}
          />
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        Dra i noderna för att flytta dem. Klicka på ett ord för att byta namn, flytta det till ett annat område eller ta
        bort det.
      </p>

      {/* Redigera ord */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Redigera ord</DialogTitle>
            <DialogDescription>Ändra ordet, flytta det till ett annat område eller ta bort det.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="word-label" className="text-sm font-medium">Ord</label>
              <Input id="word-label" value={draftLabel} onChange={(e) => setDraftLabel(e.target.value)} className="h-11" />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Område</label>
              <Select value={targetCat} onValueChange={setTargetCat}>
                <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-popover z-50">
                  {profile.categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {word && (
              <div className="rounded-lg border bg-secondary/40 p-3 text-sm space-y-1">
                <p className="font-semibold flex items-center gap-1.5"><Info className="w-4 h-4" /> Vad betyder det?</p>
                <p className="text-muted-foreground">{word.definition}</p>
                <p className="text-muted-foreground italic">{word.reflectionQuestion}</p>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:justify-between">
            <Button
              variant="ghost"
              className="text-destructive min-h-11"
              onClick={() => {
                if (editing) onRemoveItem(editing.categoryId, editing.label);
                setEditing(null);
              }}
            >
              <Trash2 className="w-4 h-4 mr-1" /> Ta bort
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" className="min-h-11" onClick={() => setEditing(null)}>Avbryt</Button>
              <Button className="min-h-11" onClick={saveWord}>Spara</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {active.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Din karta fylls på när du valt ord i stegen ovan.
        </p>
      )}
    </div>
  );
};
