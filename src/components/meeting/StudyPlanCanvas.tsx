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
  Settings, Briefcase, ChevronsRight, ChevronsLeft, GripVertical, MoreVertical, Check, ClipboardList,
} from 'lucide-react';
import { RotateCcw, Pencil, CalendarRange, X } from 'lucide-react';
import { PreExportSummary } from './PreExportSummary';
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

export type SupplementType = 'Inlämningsuppgift' | 'Laboration' | 'Projekt' | 'Övrig examination';

export const SUPPLEMENT_TYPES: SupplementType[] = [
  'Inlämningsuppgift', 'Laboration', 'Projekt', 'Övrig examination',
];

export type SupplementItem = {
  id: string;
  type: SupplementType;
  courseCode: string;
  description: string;
  term: string;
  placement: 'LP1' | 'LP2' | 'LP3' | 'LP4';
  done?: boolean;
};

const PLACEMENT_ORDER: Placement[] = ['LP1', 'LP2', 'LP3', 'LP4', 'OmtentamenI', 'OmtentamenII'];
const LP_ORDER: Placement[] = ['LP1', 'LP2', 'LP3', 'LP4'];
const OMT_ORDER: Placement[] = ['OmtentamenI', 'OmtentamenII'];

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

/** Kronologisk sorteringsnyckel: HT2026 < VT2027 < HT2027 < VT2028 ... */
const termKey = (t: string): number => {
  const m = t.match(/^(HT|VT)(\d{4})$/);
  if (!m) return Number.MAX_SAFE_INTEGER;
  const year = parseInt(m[2]);
  // Inom samma kalenderår kommer VT (jan–jun) före HT (aug–dec).
  return year * 2 + (m[1] === 'VT' ? 0 : 1);
};

const sortTerms = (list: string[]) => [...list].sort((a, b) => termKey(a) - termKey(b));

function suggestNextTerm(existing: string[]): string {
  const valid = existing.filter((t) => /^(HT|VT)\d{4}$/.test(t));
  if (valid.length === 0) return 'HT2026';
  const last = sortTerms(valid)[valid.length - 1];
  const m = last.match(/^(HT|VT)(\d{4})$/)!;
  const year = parseInt(m[2]);
  return m[1] === 'HT' ? `VT${year + 1}` : `HT${year}`;
}

const effectiveHP = (it: ActionPlanItem) => (it.hp * (it.studyPace ?? 100)) / 100;

/** Visar hp utan avrundningsfel: 3.75 → "3,75", 7.5 → "7,5", 15 → "15". */
const fmtHp = (n: number) => String(Math.round(n * 100) / 100).replace('.', ',');

export const isOmt = (p: Placement) => p === 'OmtentamenI' || p === 'OmtentamenII';

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
  { kind: 'between', placement: 'LP2', periods: ['2', '3'], label: 'Mellan LP2–LP3 (flerperiod)' },
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
  /** Anpassar rubriker och hjälptexter för student- respektive vägledarvyn. */
  variant?: 'student' | 'counselor';
  supplements?: SupplementItem[];
  setSupplements?: React.Dispatch<React.SetStateAction<SupplementItem[]>>;
  /** Visas som "Återställ plan" i planeringsrubriken när den skickas in. */
  onReset?: () => void;
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
            {fmtHp(totalHp)} hp
            {isMulti && ` · ${fmtHp(perLp)} hp/LP`}
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
const DraggableSupplementBlock = ({
  s, fullscreen, onRemove,
}: { s: SupplementItem; fullscreen?: boolean; onRemove: () => void }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: `sup:${s.id}` });
  const style = { transform: CSS.Translate.toString(transform), opacity: isDragging ? 0.4 : 1 };
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'group relative rounded border border-dashed border-primary/50 bg-primary/5 px-1.5 py-1',
        fullscreen ? 'text-[11px]' : 'text-[10px]',
      )}
      title={`${s.type}${s.courseCode ? ` – ${s.courseCode}` : ''}: ${s.description}`}
    >
      <div className="flex items-start gap-1">
        <button
          {...listeners}
          {...attributes}
          className="text-muted-foreground/60 hover:text-foreground cursor-grab active:cursor-grabbing"
          aria-label="Dra för att flytta komplettering"
        >
          <GripVertical className={fullscreen ? 'w-3.5 h-3.5' : 'w-3 h-3'} />
        </button>
        <div className="min-w-0 flex-1">
          <div className="font-medium text-primary">{s.type}</div>
          <div className="truncate text-muted-foreground">
            {s.courseCode ? `${s.courseCode} · ` : ''}{s.description || 'Komplettering'}
          </div>
        </div>
      </div>
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
        {fmtHp(perLp)} hp · av {fmtHp(totalHp)} totalt
      </div>
    </div>
  );
};

/* ============================== Droppable LP cell ============================== */
const DroppableCell = ({
  term, placement, items, ghosts, supplements = [], onAdd, onRemove, onUpdatePeriods, fullscreen,
}: {
  term: string;
  placement: Placement;
  items: ActionPlanItem[];
  ghosts: ActionPlanItem[];
  supplements?: SupplementItem[];
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
        {supplements.map((s) => (
          <div
            key={`sup-${s.id}`}
            className={cn(
              'rounded border border-dashed border-primary/50 bg-primary/5 px-1.5 py-1',
              fullscreen ? 'text-[11px]' : 'text-[10px]',
            )}
            title={`${s.type}${s.courseCode ? ` – ${s.courseCode}` : ''}: ${s.description}`}
          >
            <div className="font-medium text-primary">{s.type}</div>
            <div className="truncate text-muted-foreground">
              {s.courseCode ? `${s.courseCode} · ` : ''}{s.description || 'Komplettering'}
            </div>
          </div>
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
  variant = 'counselor', supplements: supplementsProp, setSupplements: setSupplementsProp,
  onReset,
}: Props) => {
  const { toast } = useToast();
  const { courses } = useCourses(program);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));
  const isStudent = variant === 'student';

  // Kompletteringar: styrs utifrån om props skickas in, annars lokalt state.
  const [localSupplements, setLocalSupplements] = useState<SupplementItem[]>([]);
  const supplements = supplementsProp ?? localSupplements;
  const setSupplements = setSupplementsProp ?? setLocalSupplements;

  const [fullscreen, setFullscreen] = useState(false);
  const [editingTerm, setEditingTerm] = useState<string | null>(null);
  const [rowQuery, setRowQuery] = useState('');
  const [rowTermFilter, setRowTermFilter] = useState('all');
  const [rowLpFilter, setRowLpFilter] = useState('all');
  const [showSummary, setShowSummary] = useState(true);

  const [extraTerms, setExtraTerms] = useState<string[]>(['HT2026', 'VT2027']);
  const terms = useMemo(() => {
    const set = new Set<string>(extraTerms);
    actionPlan.forEach((i) => set.add(i.term));
    return sortTerms(Array.from(set));
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
  // "Ange själv" – fria läsperioder i placeringsvalet
  const [manualPeriods, setManualPeriods] = useState<string[]>([]);

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
    setManualPeriods(placement.startsWith('LP') ? [placement.replace('LP', '')] : []);
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
    if (kind === 'manual') {
      const sorted = [...manualPeriods].sort();
      if (sorted.length === 0) return { placement: addPlacement };
      return { placement: `LP${sorted[0]}` as Placement, periods: sorted };
    }
    if (kind === 'between') {
      const [pl, periods] = val.split('|');
      return { placement: pl as Placement, periods: periods.split(',') };
    }
    return { placement: val as Placement };
  };

  const addCourseWithChoice = (c: any, choiceKey: string) => {
    const { placement, periods } = placementChoiceFromKey(choiceKey);
    // Omtentamenskurser tillhör ingen läsperiod – periods lämnas tom.
    const resolvedPeriods = isOmt(placement) ? [] : (periods ?? c.periods ?? []);
    setActionPlan((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).slice(2, 9),
        code: c.code,
        name: c.name,
        hp: Number(c.hp),
        periods: resolvedPeriods,
        term: addTerm,
        placement,
        studyPace: 100,
      },
    ]);
    setPendingCourseId(null);
    toast({ title: 'Tillagd', description: `${c.code} – ${addTerm} ${placementShort(placement)}` });
  };

  const smartDefaultChoice = (c: any): string => {
    if (isOmt(addPlacement)) return `single:${addPlacement}`;
    const ps: string[] = c?.periods || [];
    if (ps.length === 2 && ps.includes('1') && ps.includes('2')) return 'between:LP1|1,2';
    if (ps.length === 2 && ps.includes('2') && ps.includes('3')) return 'between:LP2|2,3';
    if (ps.length === 2 && ps.includes('3') && ps.includes('4')) return 'between:LP3|3,4';
    if (ps.length === 1) return `single:LP${ps[0]}`;
    if (ps.length > 2) { setManualPeriods([...ps].sort()); return 'manual:custom'; }
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
    const periods = [...customPeriods].sort();
    // Flerperiodskurs: ankras i första valda läsperioden, hp fördelas jämnt över perioderna.
    const placement: Placement = periods.length > 0 ? (`LP${periods[0]}` as Placement) : addPlacement;
    setActionPlan((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).slice(2, 9),
        code: customCode.trim(),
        name: customName.trim(),
        hp: parseFloat(customHp) || 0,
        periods,
        term: addTerm,
        placement,
        studyPace: customPace,
        isCustom: true,
      },
    ]);
    setCustomOpen(false);
    setCustomCode(''); setCustomName(''); setCustomHp('7.5'); setCustomPeriods([]); setCustomPace(100);
    toast({
      title: 'Egen kurs tillagd',
      description: periods.length > 1
        ? `${customCode} – ${addTerm} LP${periods.join('+')} (hp fördelas per läsperiod)`
        : `${customCode} – ${addTerm} ${placementShort(placement)}`,
    });
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

  /** Byt namn på en termin – uppdaterar även kurser och kompletteringar. */
  const renameTerm = (oldName: string, rawNew: string) => {
    const newName = rawNew.trim();
    if (!newName || newName === oldName) return;
    setExtraTerms((prev) => {
      const withNew = prev.map((x) => (x === oldName ? newName : x));
      return withNew.includes(newName) ? Array.from(new Set(withNew)) : withNew;
    });
    setActionPlan((prev) => prev.map((i) => (i.term === oldName ? { ...i, term: newName } : i)));
    setSupplements((prev) => prev.map((s) => (s.term === oldName ? { ...s, term: newName } : s)));
  };

  /** Lägg till ett helt läsår (HT + VT). */
  const addAcademicYear = () => {
    const years = terms
      .map((t) => t.match(/^(HT|VT)(\d{4})$/))
      .filter(Boolean)
      .map((m) => (m![1] === 'HT' ? parseInt(m![2]) : parseInt(m![2]) - 1));
    const base = years.length > 0 ? Math.max(...years) + 1 : new Date().getFullYear();
    setExtraTerms((prev) => Array.from(new Set([...prev, `HT${base}`, `VT${base + 1}`])));
    toast({ title: 'Läsår tillagt', description: `HT${base} / VT${base + 1}` });
  };

  // Summary calculation: totals + per-LP breakdown
  const summary = useMemo(() => {
    const byTerm: Record<string, {
      hp: number; pct: number; count: number; perLp: Record<Placement, number>;
      omtHp: number; omtCount: number;
    }> = {};
    let totalHp = 0;
    const empty = (): Record<Placement, number> => ({ LP1: 0, LP2: 0, LP3: 0, LP4: 0, OmtentamenI: 0, OmtentamenII: 0 });
    const emptyRow = () => ({ hp: 0, pct: 0, count: 0, perLp: empty(), omtHp: 0, omtCount: 0 });
    terms.forEach((t) => { byTerm[t] = emptyRow(); });
    actionPlan.forEach((it) => {
      const e = effectiveHP(it);
      byTerm[it.term] = byTerm[it.term] || emptyRow();
      // Omtentamensperioder ligger utanför studietakten och räknas separat.
      if (isOmt(it.placement)) {
        byTerm[it.term].omtHp += e;
        byTerm[it.term].omtCount += 1;
        byTerm[it.term].perLp[it.placement] += e;
        return;
      }
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
    const activeId = String(active.id);
    const pl = placement as Placement;

    // Kompletteringar: dras endast mellan LP1–LP4, aldrig till omtentamensperioder.
    if (activeId.startsWith('sup:')) {
      if (isOmt(pl)) {
        toast({
          title: 'Går inte att placera här',
          description: 'Kompletteringar kopplas till läsperiod 1–4.',
          variant: 'destructive',
        });
        return;
      }
      const supId = activeId.slice(4);
      setSupplements((prev) => prev.map((s) => (s.id === supId ? { ...s, term, placement: pl as SupplementItem['placement'] } : s)));
      return;
    }

    setActionPlan((prev) => prev.map((i) => {
      if (i.id !== activeId) return i;
      // Flytt till/från omtentamen nollställer flerperiodsplaceringen.
      if (isOmt(pl)) return { ...i, term, placement: pl, periods: [] };
      const periods = (i.periods || []).length > 1 ? i.periods : [pl.replace('LP', '')];
      return { ...i, term, placement: pl, periods };
    }));
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
      {onReset && (
        <Button size="sm" variant="outline" onClick={onReset}>
          <RotateCcw className="w-4 h-4 mr-1" /> Återställ plan
        </Button>
      )}
    </div>
  );

  /* ---------------- Avslutssteg: sammanställning + export ---------------- */
  const finishBlock = (
    <div className="mt-8 space-y-4 border-t pt-6">
      <PreExportSummary actionPlan={actionPlan} supplements={supplements} terms={terms} />
      <div className="rounded-lg border bg-muted/20 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="font-semibold text-sm">Klar med planeringen?</div>
          <p className="text-xs text-muted-foreground">
            Gå igenom sammanställningen ovan och exportera sedan din studieplanering som dokument.
          </p>
        </div>
        <Button size="lg" onClick={onExport}>
          <Download className="w-4 h-4 mr-2" /> Exportera din studieplanering
        </Button>
      </div>
    </div>
  );

  /* ---------------- Visual planning grid (shared between standard and fullscreen) ---------------- */
  const renderCell = (t: string, p: Placement, isFs: boolean) => {
    const items = actionPlan.filter((i) => i.term === t && i.placement === p);
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
        key={`${t}|${p}`}
        term={t}
        placement={p}
        items={items}
        ghosts={ghosts}
        supplements={supplements.filter((s) => s.term === t && s.placement === (p as any))}
        onAdd={() => openAddDialog(t, p)}
        onRemove={removeItem}
        onUpdatePeriods={(id, periods) => {
          const sorted = [...periods].sort();
          const minLp = sorted[0];
          updateItem(id, { periods: sorted, ...(minLp ? { placement: `LP${minLp}` as Placement } : {}) });
        }}
        fullscreen={isFs}
      />
    );
  };

  const renderOmtBlock = (variant: 'default' | 'fullscreen') => (
    <div className={cn('mt-6 border rounded-lg p-3 bg-card', variant === 'fullscreen' && 'p-4')}>
      <div className="mb-2">
        <h4 className={cn('font-bold flex items-center gap-2', variant === 'fullscreen' ? 'text-base' : 'text-sm')}>
          <CalendarRange className="w-4 h-4 text-primary" /> Omtentamensperioder
        </h4>
        <p className="text-xs text-muted-foreground">
          Omtentamen I (april) och Omtentamen II (augusti) – separat från läsperioderna ovan.
        </p>
      </div>
      <div className="space-y-3">
        {terms.map((t) => (
          <div key={`omt-${t}`}>
            <div className="text-xs font-medium text-muted-foreground mb-1">{t}</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {OMT_ORDER.map((p) => renderCell(t, p, variant === 'fullscreen'))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderTermsGrid = (variant: 'default' | 'fullscreen') => (
    <div className={variant === 'fullscreen' ? 'space-y-5' : 'space-y-4'}>
      {terms.map((t) => (
        <div key={t} className={cn('border rounded-lg p-3 bg-card', variant === 'fullscreen' && 'p-4')}>
          <div className="flex items-center justify-between mb-2">
            {editingTerm === t ? (
              <div className="flex items-center gap-1">
                <Input
                  autoFocus
                  defaultValue={t}
                  className="h-7 w-32 text-sm"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') { renameTerm(t, (e.target as HTMLInputElement).value); setEditingTerm(null); }
                    if (e.key === 'Escape') setEditingTerm(null);
                  }}
                  onBlur={(e) => { renameTerm(t, e.target.value); setEditingTerm(null); }}
                />
                <span className="text-[10px] text-muted-foreground">Enter för att spara</span>
              </div>
            ) : (
              <button
                onClick={() => setEditingTerm(t)}
                className={cn('font-bold flex items-center gap-1 hover:text-primary group', variant === 'fullscreen' ? 'text-base' : 'text-sm')}
                title="Byt namn på terminen"
              >
                {t}
                <Pencil className="w-3 h-3 opacity-40 group-hover:opacity-100" />
              </button>
            )}
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground">
                {fmtHp(summary.byTerm[t]?.hp)} hp · {summary.byTerm[t]?.pct}%
              </span>
              <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive" onClick={() => removeTerm(t)}>
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
          <div className={cn(
            variant === 'fullscreen'
              ? 'grid grid-cols-4 gap-3'
              : 'grid grid-cols-2 lg:grid-cols-4 gap-2',
          )}>
            {LP_ORDER.map((p) => renderCell(t, p, variant === 'fullscreen'))}
          </div>
        </div>
      ))}
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" size="sm" onClick={addNewTerm}>
          <Plus className="w-4 h-4 mr-1" /> Lägg till termin ({suggestNextTerm(terms)})
        </Button>
        <Button variant="outline" size="sm" onClick={addAcademicYear}>
          <CalendarRange className="w-4 h-4 mr-1" /> Lägg till läsår
        </Button>
      </div>
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
          <div className="text-3xl font-bold text-primary">{fmtHp(summary.totalHp)}</div>
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
                  <span className="text-muted-foreground">{fmtHp(s.hp)} hp · {s.pct}%</span>
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
                          {fmtHp(v)} hp
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
                        <span className="font-medium">{fmtHp(v)} hp</span>
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
        {supplements.length > 0 && (
          <div className="text-[10px] text-muted-foreground pt-2 border-t space-y-1">
            <div className="font-medium text-foreground">Kompletteringar</div>
            {terms.map((t) => {
              const n = supplements.filter((s) => s.term === t).length;
              if (n === 0) return null;
              return <div key={t}>{t}: {n} st ({supplements.filter((s) => s.term === t && s.done).length} klara)</div>;
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );

  /* ---------------- Komplettering ---------------- */
  const addSupplement = () => {
    setSupplements((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).slice(2, 9),
        type: 'Inlämningsuppgift',
        courseCode: '',
        description: '',
        term: terms[0] || 'HT2026',
        placement: 'LP1',
        done: false,
      },
    ]);
  };
  const updateSupplement = (id: string, patch: Partial<SupplementItem>) =>
    setSupplements((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  const removeSupplement = (id: string) =>
    setSupplements((prev) => prev.filter((s) => s.id !== id));

  const kompletteringBlock = (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
        <div>
          <h4 className="font-bold text-sm flex items-center gap-2">
            <ClipboardList className="w-4 h-4 text-primary" /> Komplettering
          </h4>
          <p className="text-xs text-muted-foreground">
            {isStudent
              ? 'Inlämningsuppgifter, labbar, projekt och andra examinationer som du behöver bli klar med. Koppla dem till en läsperiod så syns de i din plan.'
              : 'Inlämningsuppgifter, labbar, projekt och övriga examinationer som saknas. Kopplas till läsperiod och tas med i sammanställning och export.'}
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={addSupplement}>
          <Plus className="w-4 h-4 mr-1" /> Lägg till komplettering
        </Button>
      </div>
      {supplements.length === 0 ? (
        <div className="border border-dashed rounded-md p-4 text-xs text-muted-foreground text-center">
          Inga kompletteringar tillagda.
        </div>
      ) : (
        <div className="border rounded-md overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-muted">
              <tr>
                <th className="text-left p-2 font-medium w-40">Typ</th>
                <th className="text-left p-2 font-medium w-28">Kurskod</th>
                <th className="text-left p-2 font-medium">Vad saknas</th>
                <th className="text-left p-2 font-medium w-28">Termin</th>
                <th className="text-left p-2 font-medium w-24">Läsperiod</th>
                <th className="text-left p-2 font-medium w-16">Klar</th>
                <th className="p-2 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {supplements.map((s) => (
                <tr key={s.id} className="border-t">
                  <td className="p-2">
                    <Select value={s.type} onValueChange={(v) => updateSupplement(s.id, { type: v as SupplementType })}>
                      <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-popover z-50">
                        {SUPPLEMENT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="p-2">
                    <Input value={s.courseCode} onChange={(e) => updateSupplement(s.id, { courseCode: e.target.value })} className="h-7 text-xs font-mono" placeholder="ABCD12" />
                  </td>
                  <td className="p-2">
                    <Input value={s.description} onChange={(e) => updateSupplement(s.id, { description: e.target.value })} className="h-7 text-xs" placeholder="t.ex. Labb 3 och inlämning 2" />
                  </td>
                  <td className="p-2">
                    <Input value={s.term} onChange={(e) => updateSupplement(s.id, { term: e.target.value })} className="h-7 text-xs" />
                  </td>
                  <td className="p-2">
                    <Select value={s.placement} onValueChange={(v) => updateSupplement(s.id, { placement: v as SupplementItem['placement'] })}>
                      <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-popover z-50">
                        {(['LP1', 'LP2', 'LP3', 'LP4'] as const).map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="p-2 text-center">
                    <Checkbox checked={!!s.done} onCheckedChange={(v) => updateSupplement(s.id, { done: v === true })} />
                  </td>
                  <td className="p-2 text-right">
                    <button onClick={() => removeSupplement(s.id)} className="text-muted-foreground hover:text-destructive">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  /* ---------------- Editable handlingsplan table ---------------- */
  const filteredRows = actionPlan.filter((it) => {
    const q = rowQuery.trim().toLowerCase();
    if (q && !`${it.code} ${it.name}`.toLowerCase().includes(q)) return false;
    if (rowTermFilter !== 'all' && it.term !== rowTermFilter) return false;
    if (rowLpFilter !== 'all' && it.placement !== rowLpFilter) return false;
    return true;
  });

  const handlingsplanTable = actionPlan.length > 0 && (
    <div className="mt-4">
      <div className="flex items-center justify-between gap-3 flex-wrap mb-2">
        <h4 className="font-bold text-sm flex items-center gap-2">
          <ListChecks className="w-4 h-4 text-primary" /> Handlingsplan
        </h4>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={rowQuery}
              onChange={(e) => setRowQuery(e.target.value)}
              placeholder="Sök kurskod eller namn…"
              className="h-8 w-56 pl-7 text-xs"
            />
            {rowQuery && (
              <button
                onClick={() => setRowQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <Select value={rowTermFilter} onValueChange={setRowTermFilter}>
            <SelectTrigger className="h-8 w-32 text-xs"><SelectValue placeholder="Termin" /></SelectTrigger>
            <SelectContent className="bg-popover z-50">
              <SelectItem value="all">Alla terminer</SelectItem>
              {terms.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={rowLpFilter} onValueChange={setRowLpFilter}>
            <SelectTrigger className="h-8 w-36 text-xs"><SelectValue placeholder="Period" /></SelectTrigger>
            <SelectContent className="bg-popover z-50">
              <SelectItem value="all">Alla perioder</SelectItem>
              {PLACEMENT_ORDER.map((p) => <SelectItem key={p} value={p}>{placementLabel(p)}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>
      {filteredRows.length === 0 && (
        <p className="text-xs text-muted-foreground mb-2">Inga kurser matchar sökningen.</p>
      )}
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
            {filteredRows.map((it) => (
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
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <RadioGroupItem value="manual:custom" id="pl-manual" />
                  <span>Ange själv</span>
                </label>
              </RadioGroup>

              {pendingChoice === 'manual:custom' && (
                <div className="rounded border bg-background p-3 space-y-2">
                  <div className="text-xs font-medium">Välj läsperioder själv</div>
                  <div className="flex flex-wrap gap-3">
                    {(['1', '2', '3', '4'] as const).map((p) => (
                      <label key={p} className="flex items-center gap-1.5 text-sm cursor-pointer">
                        <Checkbox
                          checked={manualPeriods.includes(p)}
                          onCheckedChange={(v) => setManualPeriods((prev) =>
                            v === true ? [...prev, p].sort() : prev.filter((x) => x !== p))}
                        />
                        LP{p}
                      </label>
                    ))}
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Väljer du flera läsperioder placeras kursen i alla valda perioder och poängen fördelas jämnt
                    (t.ex. 10 hp över LP2 och LP3 = 5 hp per läsperiod).
                  </p>
                </div>
              )}

              <p className="text-[11px] text-muted-foreground">
                Flerperiodskurser visas i samtliga valda läsperioder och hp delas lika mellan dem.
              </p>
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
              disabled={!selectedCourseId || !pendingChoice || (pendingChoice === 'manual:custom' && manualPeriods.length === 0)}
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
                  <GraduationCap className="w-5 h-5 text-primary" />
                  {isStudent ? 'Min studieplanering – Helskärmsläge' : 'Stöd i studieplanering – Helskärmsläge'}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {isStudent
                    ? 'Dra och släpp dina kurser mellan läsperioderna. Till höger ser du hp per termin och läsperiod.'
                    : 'Dra och släpp kurser mellan LP. Sammanställning visar HP per termin och läsperiod.'}
                </p>
              </div>
              {headerButtons}
            </header>

            <div className="flex-1 flex overflow-hidden">
              <main className="flex-1 overflow-auto p-6">
                <div className="min-w-[1200px]">
                  {renderTermsGrid('fullscreen')}
                  {renderOmtBlock('fullscreen')}
                  {handlingsplanTable}
                  {kompletteringBlock}
                  {finishBlock}
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
                {isStudent ? 'Min studieplanering' : 'Stöd i studieplanering'}
              </CardTitle>
              <CardDescription>
                {isStudent
                  ? 'Lägg till dina kurser i rätt termin och läsperiod. Dra och släpp för att flytta dem – sammanställningen till höger visar hur många hp du planerar.'
                  : 'Planera kurser per termin och läsperiod. Dra och släpp för att flytta kurser. Sammanställning visas till höger.'}
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
              {renderOmtBlock('default')}
              {handlingsplanTable}
              {kompletteringBlock}
              {finishBlock}
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