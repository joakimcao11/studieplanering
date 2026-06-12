import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Plus, Trash2, ChevronLeft, ChevronRight, ExternalLink, Download, GraduationCap,
  CalendarDays, ListChecks, Search, Sparkles, Maximize2, Minimize2, Home, Wrench,
  Settings, Briefcase, ChevronsRight, ChevronsLeft, GripVertical, MoreVertical, Check,
} from 'lucide-react';
import {
  DndContext, DragEndEvent, PointerSensor, useSensor, useSensors,
  useDraggable, useDroppable,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { useCourses } from '@/hooks/useCourses';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export type Placement = 'LP1' | 'LP2' | 'LP3' | 'LP4' | 'OmtentamenI' | 'OmtentamenII';

export type ActionPlanItem = {
  id: string;
  code: string;
  name: string;
  hp: number;
  periods: string[];
  term: string;
  placement: Placement;
  studyPace?: 25 | 50 | 75 | 100;
  isCustom?: boolean;
};

const PLACEMENT_ORDER: Placement[] = ['LP1', 'LP2', 'LP3', 'LP4', 'OmtentamenI', 'OmtentamenII'];

const placementLabel = (p: Placement) => {
  if (p === 'OmtentamenI') return 'Omtentamen I (april)';
  if (p === 'OmtentamenII') return 'Omtentamen II (augusti)';
  return p;
};
const placementShort = (p: Placement) => {
  if (p === 'OmtentamenI') return 'Omt. I';
  if (p === 'OmtentamenII') return 'Omt. II';
  return p;
};

function suggestNextTerm(existing: string[]): string {
  if (existing.length === 0) return 'HT2026';
  const last = existing[existing.length - 1];
  const m = last.match(/^(HT|VT)(\d{4})$/);
  if (!m) return 'HT2026';
  const sem = m[1];
  const year = parseInt(m[2]);
  return sem === 'HT' ? `VT${year + 1}` : `HT${year}`;
}

const effectiveHP = (it: ActionPlanItem) => (it.hp * (it.studyPace ?? 100)) / 100;

/** Placement options shown in the per-course "Lägg till"-popover. */
type PlacementChoice =
  | { kind: 'single'; placement: Placement; label: string }
  | { kind: 'between'; placement: Placement; periods: string[]; label: string };

const PLACEMENT_CHOICES: PlacementChoice[] = [
  { kind: 'single', placement: 'LP1', label: 'LP1' },
  { kind: 'single', placement: 'LP2', label: 'LP2' },
  { kind: 'single', placement: 'LP3', label: 'LP3' },
  { kind: 'single', placement: 'LP4', label: 'LP4' },
  { kind: 'between', placement: 'LP1', periods: ['1', '2'], label: 'Mellan LP1–LP2 (flerperiod)' },
  { kind: 'between', placement: 'LP3', periods: ['3', '4'], label: 'Mellan LP3–LP4 (flerperiod)' },
  { kind: 'single', placement: 'OmtentamenI', label: 'Omtentamen I (april)' },
  { kind: 'single', placement: 'OmtentamenII', label: 'Omtentamen II (augusti)' },
];

interface Props {
  program: string;
  actionPlan: ActionPlanItem[];
  setActionPlan: React.Dispatch<React.SetStateAction<ActionPlanItem[]>>;
  studyPlanText: string;
  setStudyPlanText: (s: string) => void;
  onExport: () => void;
}

/* ============================== Draggable course block ============================== */
const DraggableCourseBlock = ({
  it, onRemove, fullscreen, onUpdatePeriods,
}: {
  it: ActionPlanItem;
  onRemove: () => void;
  fullscreen?: boolean;
  onUpdatePeriods: (periods: string[]) => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: it.id });
  const style = { transform: CSS.Translate.toString(transform), opacity: isDragging ? 0.4 : 1 };
  const isMulti = (it.periods?.length || 0) > 1;
  const totalHp = effectiveHP(it);
  const perLp = isMulti ? totalHp / it.periods.length : totalHp;
  const [editOpen, setEditOpen] = useState(false);
  const [draftPeriods, setDraftPeriods] = useState<string[]>(it.periods || []);
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group relative bg-background border rounded px-1.5 py-1 cursor-grab active:cursor-grabbing',
        fullscreen ? 'text-xs' : 'text-[11px]',
        isMulti && 'bg-warning/15 border-l-4 border-l-warning',
      )}
    >
      <div className="flex items-start gap-1">
        <button {...listeners} {...attributes} className="text-muted-foreground/60 hover:text-foreground" aria-label="Dra för att flytta">
          <GripVertical className={fullscreen ? 'w-3.5 h-3.5' : 'w-3 h-3'} />
        </button>
        <div className="min-w-0 flex-1">
          <div className={cn('font-mono text-muted-foreground', fullscreen ? 'text-[11px]' : 'text-[10px]')}>{it.code}</div>
          <div className="truncate" title={it.name}>{it.name}</div>
          <div className={cn('text-primary', fullscreen ? 'text-[11px]' : 'text-[10px]')}>
            {totalHp.toFixed(1).replace(/\.0$/, '')} hp
            {isMulti && ` · ${perLp.toFixed(1).replace(/\.0$/, '')} hp/LP`}
            {it.studyPace && it.studyPace !== 100 ? ` (${it.studyPace}%)` : ''}
            {isMulti && ` · LP${it.periods.join('+')}`}
          </div>
        </div>
      </div>
      <Popover open={editOpen} onOpenChange={(o) => { setEditOpen(o); if (o) setDraftPeriods(it.periods || []); }}>
        <PopoverTrigger asChild>
          <button
            className="absolute top-0.5 right-5 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground"
            title="Redigera flerperiod"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreVertical className="w-3 h-3" />
          </button>
        </PopoverTrigger>
        <PopoverContent
          className="w-56 z-[60]"
          align="end"
          collisionPadding={16}
          sideOffset={8}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="space-y-2">
            <div className="text-xs font-medium">Läsperioder (flerperiod)</div>
            <div className="grid grid-cols-4 gap-1">
              {(['1','2','3','4'] as const).map((p) => (
                <label key={p} className="flex items-center gap-1 text-xs cursor-pointer">
                  <Checkbox
                    checked={draftPeriods.includes(p)}
                    onCheckedChange={(v) => setDraftPeriods((prev) => v === true ? [...prev, p].sort() : prev.filter((x) => x !== p))}
                  />
                  LP{p}
                </label>
              ))}
            </div>
            <Button size="sm" className="w-full" onClick={() => { onUpdatePeriods(draftPeriods); setEditOpen(false); }}>
              Spara
            </Button>
          </div>
        </PopoverContent>
      </Popover>
      <button
        onClick={onRemove}
        className="absolute top-0.5 right-0.5 opacity-0 group-hover:opacity-100 text-destructive"
        title="Ta bort"
      >
        <Trash2 className="w-3 h-3" />
      </button>
    </div>
  );
};

/* ============================== Ghost (read-only) span block ============================== */
const GhostBlock = ({ it, fullscreen }: { it: ActionPlanItem; fullscreen?: boolean }) => {
  const totalHp = effectiveHP(it);
  const perLp = totalHp / (it.periods.length || 1);
  return (
    <div
      className={cn(
        'relative border border-dashed border-warning/60 bg-warning/10 rounded px-1.5 py-1 text-muted-foreground',
        fullscreen ? 'text-xs' : 'text-[11px]',
      )}
      title={`${it.code} – flerperiodskurs (LP${it.periods.join('+')})`}
    >
      <div className={cn('font-mono', fullscreen ? 'text-[11px]' : 'text-[10px]')}>{it.code}</div>
      <div className="truncate italic" title={it.name}>↳ {it.name}</div>
      <div className={cn('text-primary/80', fullscreen ? 'text-[11px]' : 'text-[10px]')}>
        {perLp.toFixed(1).replace(/\.0$/, '')} hp · av {totalHp.toFixed(1).replace(/\.0$/, '')} totalt
      </div>
    </div>
  );
};

/* ============================== Droppable LP cell ============================== */
const DroppableCell = ({
  term, placement, items, ghosts, onAdd, onRemove, onUpdatePeriods, fullscreen,
}: {
  term: string;
  placement: Placement;
  items: ActionPlanItem[];
  ghosts: ActionPlanItem[];
  onAdd: () => void;
  onRemove: (id: string) => void;
  onUpdatePeriods: (id: string, periods: string[]) => void;
  fullscreen?: boolean;
}) => {
  const { setNodeRef, isOver } = useDroppable({ id: `${term}|${placement}` });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        'border rounded-md p-2 bg-muted/30 transition-colors',
        fullscreen ? 'min-h-[140px]' : 'min-h-[90px]',
        isOver && 'border-primary bg-primary/10',
      )}
    >
      <div className={cn(
        'uppercase tracking-wider text-muted-foreground mb-1 font-semibold',
        fullscreen ? 'text-xs' : 'text-[10px]',
      )}>
        {placementShort(placement)}
      </div>
      <div className="space-y-1">
        {items.map((it) => (
          <DraggableCourseBlock
            key={it.id}
            it={it}
            onRemove={() => onRemove(it.id)}
            onUpdatePeriods={(periods) => onUpdatePeriods(it.id, periods)}
            fullscreen={fullscreen}
          />
        ))}
        {ghosts.map((it) => (
          <GhostBlock key={`ghost-${it.id}`} it={it} fullscreen={fullscreen} />
        ))}
        <button
          onClick={onAdd}
          className={cn(
            'w-full py-1 border border-dashed rounded text-muted-foreground hover:border-primary hover:text-primary flex items-center justify-center gap-1',
            fullscreen ? 'text-xs' : 'text-[10px]',
          )}
        >
          <Plus className="w-3 h-3" /> Lägg till
        </button>
      </div>
    </div>
  );
};

/* ============================== Main component ============================== */
export const StudyPlanCanvas = ({
  program, actionPlan, setActionPlan, studyPlanText, setStudyPlanText, onExport,
}: Props) => {
  const { toast } = useToast();
  const { courses } = useCourses(program);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const [fullscreen, setFullscreen] = useState(false);
  const [showSummary, setShowSummary] = useState(true);

  const [extraTerms, setExtraTerms] = useState<string[]>(['HT2026', 'VT2027']);
  const terms = useMemo(() => {
    const set = new Set<string>(extraTerms);
    actionPlan.forEach((i) => set.add(i.term));
    return Array.from(set).sort((a, b) => {
      const ya = parseInt(a.slice(2)); const yb = parseInt(b.slice(2));
      if (ya !== yb) return ya - yb;
      return a.startsWith('HT') ? -1 : 1;
    });
  }, [actionPlan, extraTerms]);

  // Add-course modal
  const [addOpen, setAddOpen] = useState(false);
  const [addTerm, setAddTerm] = useState<string>('HT2026');
  const [addPlacement, setAddPlacement] = useState<Placement>('LP1');
  const [search, setSearch] = useState('');
  const [periodChecks, setPeriodChecks] = useState<Record<string, boolean>>({ '1': false, '2': false, '3': false, '4': false });

  // Custom course modal
  const [customOpen, setCustomOpen] = useState(false);
  const [customCode, setCustomCode] = useState('');
  const [customName, setCustomName] = useState('');
  const [customHp, setCustomHp] = useState('7.5');
  const [customPeriods, setCustomPeriods] = useState<string[]>([]);
  const [customPace, setCustomPace] = useState<25 | 50 | 75 | 100>(100);

  // Per-course placement chooser popover
  const [pendingCourseId, setPendingCourseId] = useState<string | null>(null);
  const [pendingChoice, setPendingChoice] = useState<string>('single:LP1');

  // Selected course inside Add-dialog (inline placement flow)
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);

  const openAddDialog = (term: string, placement: Placement) => {
    setAddTerm(term);
    setAddPlacement(placement);
    if (placement === 'LP1') setPeriodChecks({ '1': true, '2': false, '3': false, '4': false });
    else if (placement === 'LP2') setPeriodChecks({ '1': false, '2': true, '3': false, '4': false });
    else if (placement === 'LP3') setPeriodChecks({ '1': false, '2': false, '3': true, '4': false });
    else if (placement === 'LP4') setPeriodChecks({ '1': false, '2': false, '3': false, '4': true });
    else setPeriodChecks({ '1': false, '2': false, '3': false, '4': false });
    setSearch('');
    setPendingChoice(`single:${placement}`);
    setSelectedCourseId(null);
    setAddOpen(true);
  };

  const filteredCourses = useMemo(() => {
    const q = search.toLowerCase();
    const activePeriods = Object.entries(periodChecks).filter(([, v]) => v).map(([k]) => k);
    return courses.filter((c) => {
      const matchSearch = !q || c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q);
      const matchPeriod = activePeriods.length === 0 || (c.periods || []).some((p) => activePeriods.includes(p));
      return matchSearch && matchPeriod;
    });
  }, [courses, search, periodChecks]);

  const placementChoiceFromKey = (key: string): { placement: Placement; periods?: string[] } => {
    const [kind, val] = key.split(':');
    if (kind === 'between') {
      const [pl, periods] = val.split('|');
      return { placement: pl as Placement, periods: periods.split(',') };
    }
    return { placement: val as Placement };
  };

  const addCourseWithChoice = (c: any, choiceKey: string) => {
    const { placement, periods } = placementChoiceFromKey(choiceKey);
    setActionPlan((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).slice(2, 9),
        code: c.code,
        name: c.name,
        hp: Number(c.hp),
        periods: periods ?? c.periods ?? [],
        term: addTerm,
        placement,
        studyPace: 100,
      },
    ]);
    setPendingCourseId(null);
    toast({ title: 'Tillagd', description: `${c.code} – ${addTerm} ${placementShort(placement)}` });
  };

  const smartDefaultChoice = (c: any): string => {
    const ps: string[] = c?.periods || [];
    if (ps.length === 2 && ps.includes('1') && ps.includes('2')) return 'between:LP1|1,2';
    if (ps.length === 2 && ps.includes('3') && ps.includes('4')) return 'between:LP3|3,4';
    if (ps.length === 1) return `single:LP${ps[0]}`;
    return `single:${addPlacement}`;
  };

  const handleSelectCourse = (c: any) => {
    setSelectedCourseId(c.id);
    setPendingChoice(smartDefaultChoice(c));
  };

  const handleConfirmAdd = () => {
    const c = filteredCourses.find((x) => x.id === selectedCourseId) ?? courses.find((x) => x.id === selectedCourseId);
    if (!c) return;
    addCourseWithChoice(c, pendingChoice);
    setAddOpen(false);
    setSelectedCourseId(null);
  };

  const addCustomCourse = () => {
    if (!customCode.trim() || !customName.trim()) {
      toast({ title: 'Saknar uppgifter', description: 'Kurskod och namn krävs.', variant: 'destructive' });
      return;
    }
    setActionPlan((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).slice(2, 9),
        code: customCode.trim(),
        name: customName.trim(),
        hp: parseFloat(customHp) || 0,
        periods: customPeriods,
        term: addTerm,
        placement: addPlacement,
        studyPace: customPace,
        isCustom: true,
      },
    ]);
    setCustomOpen(false);
    setCustomCode(''); setCustomName(''); setCustomHp('7.5'); setCustomPeriods([]); setCustomPace(100);
    toast({ title: 'Egen kurs tillagd', description: `${customCode} – ${addTerm} ${placementShort(addPlacement)}` });
  };

  const updateItem = (id: string, patch: Partial<ActionPlanItem>) => {
    setActionPlan((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  };
  const removeItem = (id: string) => setActionPlan((prev) => prev.filter((i) => i.id !== id));

  const addNewTerm = () => {
    const next = suggestNextTerm(terms);
    setExtraTerms((prev) => [...prev, next]);
  };
  const removeTerm = (t: string) => {
    setExtraTerms((prev) => prev.filter((x) => x !== t));
    setActionPlan((prev) => prev.filter((i) => i.term !== t));
  };

  // Summary calculation: totals + per-LP breakdown
  const summary = useMemo(() => {
    const byTerm: Record<string, { hp: number; pct: number; count: number; perLp: Record<Placement, number> }> = {};
    let totalHp = 0;
    const empty = (): Record<Placement, number> => ({ LP1: 0, LP2: 0, LP3: 0, LP4: 0, OmtentamenI: 0, OmtentamenII: 0 });
    terms.forEach((t) => { byTerm[t] = { hp: 0, pct: 0, count: 0, perLp: empty() }; });
    actionPlan.forEach((it) => {
      const e = effectiveHP(it);
      byTerm[it.term] = byTerm[it.term] || { hp: 0, pct: 0, count: 0, perLp: empty() };
      byTerm[it.term].hp += e;
      byTerm[it.term].count += 1;
      // Distribute HP across multi-period courses (e.g. between LP1-LP2)
      const lpKeys: Placement[] = (it.periods || []).length > 1
        ? (it.periods.map((p) => `LP${p}` as Placement))
        : [it.placement];
      const share = e / lpKeys.length;
      lpKeys.forEach((k) => { byTerm[it.term].perLp[k] = (byTerm[it.term].perLp[k] || 0) + share; });
      totalHp += e;
    });
    Object.values(byTerm).forEach((v) => { v.pct = Math.round((v.hp / 30) * 100); });
    return { byTerm, totalHp };
  }, [actionPlan, terms]);

  const colorFor = (hp: number, target = 30) => {
    const lo = target * 0.9, hi = target * 1.1;
    const lo2 = target * 0.6, hi2 = target * 1.2;
    if (hp >= lo && hp <= hi) return 'hsl(142 71% 45%)';
    if (hp >= lo2 && hp <= hi2) return 'hsl(38 92% 50%)';
    return 'hsl(0 84% 60%)';
  };

  /* ---------------- Drag end handler ---------------- */
  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over) return;
    const target = String(over.id);
    const [term, placement] = target.split('|');
    if (!term || !placement) return;
    setActionPlan((prev) => prev.map((i) => i.id === active.id ? { ...i, term, placement: placement as Placement } : i));
  };

  /* ---------------- Header buttons (shared) ---------------- */
  const headerButtons = (
    <div className="flex gap-2 flex-wrap">
      <a href="https://cloud.timeedit.net/lu/web/lth1/" target="_blank" rel="noopener noreferrer">
        <Button size="sm" variant="outline">
          <CalendarDays className="w-4 h-4 mr-1" /> Visa schema i TimeEdit
          <ExternalLink className="w-3 h-3 ml-1" />
        </Button>
      </a>
      <Button size="sm" variant="outline" onClick={() => setFullscreen((s) => !s)}>
        {fullscreen
          ? <><Minimize2 className="w-4 h-4 mr-1" /> Avsluta helskärmsläge</>
          : <><Maximize2 className="w-4 h-4 mr-1" /> Helskärmsläge</>}
      </Button>
      <Button size="sm" onClick={onExport}>
        <Download className="w-4 h-4 mr-1" /> Exportera din studieplanering
      </Button>
    </div>
  );

  /* ---------------- Visual planning grid (shared between standard and fullscreen) ---------------- */
  const renderTermsGrid = (variant: 'default' | 'fullscreen') => (
    <div className={variant === 'fullscreen' ? 'space-y-5' : 'space-y-4'}>
      {terms.map((t) => (
        <div key={t} className={cn('border rounded-lg p-3 bg-card', variant === 'fullscreen' && 'p-4')}>
          <div className="flex items-center justify-between mb-2">
            <h4 className={cn('font-bold', variant === 'fullscreen' ? 'text-base' : 'text-sm')}>{t}</h4>
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground">
                {summary.byTerm[t]?.hp.toFixed(1).replace(/\.0$/, '')} hp · {summary.byTerm[t]?.pct}%
              </span>
              <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive" onClick={() => removeTerm(t)}>
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
          <div className={cn(
            variant === 'fullscreen'
              ? 'grid grid-cols-6 gap-3'
              : 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2',
          )}>
            {PLACEMENT_ORDER.map((p) => {
              const items = actionPlan.filter((i) => i.term === t && i.placement === p);
              // Ghost blocks: multi-period courses whose anchor is in another LP but spans this one.
              const ghosts = actionPlan.filter((i) => {
                if (i.term !== t) return false;
                if (i.placement === p) return false;
                if (!i.periods || i.periods.length < 2) return false;
                if (p === 'OmtentamenI' || p === 'OmtentamenII') return false;
                const lpNum = p.replace('LP', '');
                return i.periods.includes(lpNum);
              });
              return (
                <DroppableCell
                  key={p}
                  term={t}
                  placement={p}
                  items={items}
                  ghosts={ghosts}
                  onAdd={() => openAddDialog(t, p)}
                  onRemove={removeItem}
                  onUpdatePeriods={(id, periods) => {
                    const sorted = [...periods].sort();
                    const minLp = sorted[0];
                    updateItem(id, { periods: sorted, ...(minLp ? { placement: `LP${minLp}` as Placement } : {}) });
                  }}
                  fullscreen={variant === 'fullscreen'}
                />
              );
            })}
          </div>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={addNewTerm}>
        <Plus className="w-4 h-4 mr-1" /> Lägg till termin ({suggestNextTerm(terms)})
      </Button>
    </div>
  );

  /* ---------------- Summary panel ---------------- */
  const summaryPanel = (
    <Card className="bg-secondary/30">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Sammanställning</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="text-center">
          <div className="text-3xl font-bold text-primary">{summary.totalHp.toFixed(1).replace(/\.0$/, '')}</div>
          <div className="text-xs text-muted-foreground">totalt hp</div>
        </div>
        <div className="space-y-3">
          {terms.map((t) => {
            const s = summary.byTerm[t] || { hp: 0, pct: 0, count: 0, perLp: { LP1:0,LP2:0,LP3:0,LP4:0,OmtentamenI:0,OmtentamenII:0 } };
            const pct = Math.min(100, s.pct);
            return (
              <div key={t} className="space-y-1.5 border-b last:border-b-0 pb-2 last:pb-0">
                <div className="flex justify-between text-xs">
                  <span className="font-medium">{t}</span>
                  <span className="text-muted-foreground">{s.hp.toFixed(1).replace(/\.0$/, '')} hp · {s.pct}%</span>
                </div>
                <div className="h-2 bg-muted rounded overflow-hidden">
                  <div className="h-full transition-all" style={{ width: `${pct}%`, backgroundColor: colorFor(s.hp) }} />
                </div>
                <div className="grid grid-cols-3 gap-1 text-[10px] mt-1">
                  {(['LP1','LP2','LP3','LP4'] as Placement[]).map((p) => {
                    const v = s.perLp[p] || 0;
                    return (
                      <div key={p} className="flex items-center gap-1">
                        <span className="font-mono text-muted-foreground">{p}</span>
                        <span className="font-medium" style={{ color: v > 0 ? colorFor(v, 15) : undefined }}>
                          {v.toFixed(1).replace(/\.0$/, '')} hp
                        </span>
                      </div>
                    );
                  })}
                  {(['OmtentamenI','OmtentamenII'] as Placement[]).map((p) => {
                    const v = s.perLp[p] || 0;
                    if (v === 0) return null;
                    return (
                      <div key={p} className="flex items-center gap-1 col-span-3">
                        <span className="font-mono text-muted-foreground">{placementShort(p)}</span>
                        <span className="font-medium">{v.toFixed(1).replace(/\.0$/, '')} hp</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
        <div className="text-[10px] text-muted-foreground pt-2 border-t">
          Mål: 30 hp/termin (≈15 hp per LP)
        </div>
      </CardContent>
    </Card>
  );

  /* ---------------- Editable handlingsplan table ---------------- */
  const handlingsplanTable = actionPlan.length > 0 && (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-bold text-sm flex items-center gap-2">
          <ListChecks className="w-4 h-4 text-primary" /> Handlingsplan
        </h4>
      </div>
      <div className="border rounded-md overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="bg-muted">
            <tr>
              <th className="text-left p-2 font-medium">Kurskod</th>
              <th className="text-left p-2 font-medium">Namn</th>
              <th className="text-left p-2 font-medium w-20">HP</th>
              <th className="text-left p-2 font-medium w-24">Studietakt</th>
              <th className="text-left p-2 font-medium w-28">Termin</th>
              <th className="text-left p-2 font-medium w-32">Period</th>
              <th className="p-2 w-10"></th>
            </tr>
          </thead>
          <tbody>
            {actionPlan.map((it) => (
              <tr key={it.id} className="border-t">
                <td className="p-2 font-mono">{it.code}{it.isCustom && <Badge variant="outline" className="ml-1 text-[9px]">egen</Badge>}</td>
                <td className="p-2">{it.name}</td>
                <td className="p-2">
                  <Input type="number" step="0.5" value={it.hp}
                    onChange={(e) => updateItem(it.id, { hp: parseFloat(e.target.value) || 0 })}
                    className="h-7 text-xs" />
                </td>
                <td className="p-2">
                  <Select value={String(it.studyPace ?? 100)} onValueChange={(v) => updateItem(it.id, { studyPace: parseInt(v) as 25 | 50 | 75 | 100 })}>
                    <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-popover z-50">
                      <SelectItem value="25">25%</SelectItem>
                      <SelectItem value="50">50%</SelectItem>
                      <SelectItem value="75">75%</SelectItem>
                      <SelectItem value="100">100%</SelectItem>
                    </SelectContent>
                  </Select>
                </td>
                <td className="p-2">
                  <Input value={it.term} onChange={(e) => updateItem(it.id, { term: e.target.value })} className="h-7 text-xs" />
                </td>
                <td className="p-2">
                  <Select value={it.placement} onValueChange={(v) => updateItem(it.id, { placement: v as Placement })}>
                    <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-popover z-50">
                      {PLACEMENT_ORDER.map((p) => (
                        <SelectItem key={p} value={p}>{placementLabel(p)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </td>
                <td className="p-2 text-right">
                  <button onClick={() => removeItem(it.id)} className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  /* ---------------- Dialogs ---------------- */
  const dialogs = (
    <>
      {/* Add course dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-4xl p-0 gap-0 flex flex-col max-h-[90vh]">
          <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
            <DialogTitle className="flex items-center gap-3 flex-wrap">
              <span>Lägg till kurs</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
              <Badge variant="secondary" className="text-sm px-3 py-1">{placementLabel(addPlacement)}</Badge>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
              <Badge variant="outline">{addTerm}</Badge>
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Left: search + filters */}
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Sök efter kurser..." className="pl-8" />
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {(['1', '2', '3', '4'] as const).map((p) => (
                    <label key={p} className="flex items-center gap-2 cursor-pointer">
                      <Checkbox checked={periodChecks[p]} onCheckedChange={(v) => setPeriodChecks((s) => ({ ...s, [p]: v === true }))} />
                      LP{p}
                    </label>
                  ))}
                </div>
                <Button variant="secondary" size="sm" className="w-full" onClick={() => setCustomOpen(true)}>
                  <Plus className="w-4 h-4 mr-1" /> Skapa egen kurs
                </Button>
              </div>

              {/* Right: course list */}
              <div className="md:col-span-2">
                <div className="max-h-80 overflow-y-auto border rounded">
                  <div className="p-1">
                    {filteredCourses.length === 0 && (
                      <p className="text-sm text-muted-foreground p-4 text-center">Inga kurser hittades</p>
                    )}
                    {filteredCourses.map((c) => {
                      const isSelected = selectedCourseId === c.id;
                      return (
                        <div
                          key={c.id}
                          className={`flex items-center justify-between gap-2 p-2 rounded transition-colors ${
                            isSelected ? 'bg-emerald-50 dark:bg-emerald-950/30' : 'hover:bg-muted/50'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            {isSelected && <Check className="w-4 h-4 text-emerald-600 shrink-0" />}
                            <div className="min-w-0 flex-1">
                              <div className="flex gap-2 items-center flex-wrap">
                                <span className="font-mono text-xs font-semibold">{c.code}</span>
                                <span className="text-xs text-primary">{c.hp} hp</span>
                                {c.periods?.length > 0 && (
                                  <Badge variant="outline" className="text-[10px]">LP{c.periods.join(',')}</Badge>
                                )}
                              </div>
                              <p className="text-sm truncate">{c.name}</p>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant={isSelected ? 'outline' : 'outline'}
                            className={isSelected ? 'border-emerald-600 text-emerald-700 hover:bg-emerald-50' : ''}
                            onClick={() => handleSelectCourse(c)}
                          >
                            {isSelected ? (<><Check className="w-3.5 h-3.5 mr-1" />Vald</>) : 'Lägg till'}
                          </Button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* Placement section — inline, always visible below the course list */}
            <div className="rounded-lg border p-4 space-y-3 bg-muted/20">
              <div className="text-sm font-semibold">Var ska kursen placeras?</div>
              <RadioGroup
                value={pendingChoice}
                onValueChange={setPendingChoice}
                className="grid grid-cols-1 sm:grid-cols-3 gap-x-4 gap-y-2"
              >
                {PLACEMENT_CHOICES.map((opt) => {
                  const key = opt.kind === 'between'
                    ? `between:${opt.placement}|${opt.periods.join(',')}`
                    : `single:${opt.placement}`;
                  return (
                    <label key={key} className="flex items-center gap-2 text-sm cursor-pointer">
                      <RadioGroupItem value={key} id={`pl-${key}`} />
                      <span>{opt.label}</span>
                    </label>
                  );
                })}
              </RadioGroup>
              <div className="flex items-center gap-2 pt-2 border-t">
                <Label className="text-xs">Termin</Label>
                <Input value={addTerm} onChange={(e) => setAddTerm(e.target.value)} className="h-8 text-xs max-w-[160px]" />
              </div>
            </div>
          </div>

          <div className="border-t px-6 py-4 shrink-0 bg-background">
            <Button
              className="w-full"
              size="lg"
              disabled={!selectedCourseId || !pendingChoice}
              onClick={handleConfirmAdd}
            >
              <Plus className="w-4 h-4 mr-1" /> Lägg till och klar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Custom course dialog */}
      <Dialog open={customOpen} onOpenChange={setCustomOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" /> Skapa egen kurs
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">Kurskod</Label>
              <Input value={customCode} onChange={(e) => setCustomCode(e.target.value)} placeholder="t.ex. ABCD12" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Kursnamn</Label>
              <Input value={customName} onChange={(e) => setCustomName(e.target.value)} placeholder="Kursens namn" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">HP</Label>
                <Input type="number" step="0.5" value={customHp} onChange={(e) => setCustomHp(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Studietakt</Label>
                <Select value={String(customPace)} onValueChange={(v) => setCustomPace(parseInt(v) as 25 | 50 | 75 | 100)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-popover z-50">
                    <SelectItem value="25">25%</SelectItem>
                    <SelectItem value="50">50%</SelectItem>
                    <SelectItem value="75">75%</SelectItem>
                    <SelectItem value="100">100%</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Läsperioder</Label>
              <div className="grid grid-cols-4 gap-1">
                {(['1', '2', '3', '4'] as const).map((p) => (
                  <label key={p} className="flex items-center gap-1 text-xs cursor-pointer">
                    <Checkbox
                      checked={customPeriods.includes(p)}
                      onCheckedChange={(v) => setCustomPeriods((prev) => v === true ? [...prev, p] : prev.filter((x) => x !== p))}
                    />
                    LP{p}
                  </label>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCustomOpen(false)}>Avbryt</Button>
            <Button onClick={addCustomCourse}>Lägg till</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );

  /* ============================== Fullscreen overlay ============================== */
  if (fullscreen) {
    return (
      <DndContext sensors={sensors} onDragEnd={onDragEnd}>
        <div className="fixed inset-0 z-50 bg-background flex">
          {/* Sidomeny */}
          <aside className="w-16 shrink-0 bg-secondary/30 border-r flex flex-col items-center py-4 gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-primary" />
            </div>
            <button className="w-10 h-10 rounded-md hover:bg-muted flex items-center justify-center" title="Hem"><Home className="w-5 h-5 text-muted-foreground" /></button>
            <button className="w-10 h-10 rounded-md bg-primary text-primary-foreground flex items-center justify-center" title="Planering"><GraduationCap className="w-5 h-5" /></button>
            <button className="w-10 h-10 rounded-md hover:bg-muted flex items-center justify-center" title="Verktyg"><Wrench className="w-5 h-5 text-muted-foreground" /></button>
            <button className="w-10 h-10 rounded-md hover:bg-muted flex items-center justify-center" title="Karriär"><Briefcase className="w-5 h-5 text-muted-foreground" /></button>
            <div className="flex-1" />
            <button className="w-10 h-10 rounded-md hover:bg-muted flex items-center justify-center" title="Inställningar"><Settings className="w-5 h-5 text-muted-foreground" /></button>
          </aside>

          {/* Main */}
          <div className="flex-1 flex flex-col min-w-0">
            <header className="border-b px-6 py-3 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-primary" /> Stöd i studieplanering – Helskärmsläge
                </h2>
                <p className="text-xs text-muted-foreground">Dra och släpp kurser mellan LP. Sammanställning visar HP per termin och läsperiod.</p>
              </div>
              {headerButtons}
            </header>

            <div className="flex-1 flex overflow-hidden">
              <main className="flex-1 overflow-auto p-6">
                <div className="min-w-[1200px]">
                  {renderTermsGrid('fullscreen')}
                  {handlingsplanTable}
                </div>
              </main>
              {showSummary && (
                <aside className="w-80 shrink-0 border-l p-4 overflow-auto bg-muted/10">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-muted-foreground">Sammanställning</span>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setShowSummary(false)} title="Dölj">
                      <ChevronsRight className="w-4 h-4" />
                    </Button>
                  </div>
                  {summaryPanel}
                </aside>
              )}
              {!showSummary && (
                <button
                  onClick={() => setShowSummary(true)}
                  className="border-l px-2 hover:bg-muted/50"
                  title="Visa sammanställning"
                >
                  <ChevronsLeft className="w-4 h-4 text-muted-foreground" />
                </button>
              )}
            </div>
          </div>

          {dialogs}
        </div>
      </DndContext>
    );
  }

  /* ============================== Standard view ============================== */
  return (
    <DndContext sensors={sensors} onDragEnd={onDragEnd}>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-primary" />
                Stöd i studieplanering
              </CardTitle>
              <CardDescription>
                Planera kurser per termin och läsperiod. Dra och släpp för att flytta kurser. Sammanställning visas till höger.
              </CardDescription>
            </div>
            {headerButtons}
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="visual" className="w-full">
            <TabsList>
              <TabsTrigger value="visual">Visuell planering</TabsTrigger>
              <TabsTrigger value="text">Textplanering</TabsTrigger>
            </TabsList>

            <TabsContent value="visual" className="mt-4">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 space-y-4">
                  {renderTermsGrid('default')}
                </div>
                <div className="space-y-3">{summaryPanel}</div>
              </div>
              {handlingsplanTable}
            </TabsContent>

            <TabsContent value="text" className="mt-4">
              <div className="space-y-2">
                <Label className="text-foreground font-medium">Textplanering</Label>
                <p className="text-xs text-muted-foreground">
                  Skriv studieplaneringen i fritext. Använd t.ex. rubriker per termin (HT2026, VT2027) och listor per LP.
                </p>
                <Textarea
                  value={studyPlanText}
                  onChange={(e) => setStudyPlanText(e.target.value)}
                  rows={14}
                  placeholder={'HT2026\n  LP1: ...\n  LP2: ...\n\nVT2027\n  LP3: ...\n  LP4: ...'}
                  className="font-mono text-sm"
                />
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
        {dialogs}
      </Card>
    </DndContext>
  );
};