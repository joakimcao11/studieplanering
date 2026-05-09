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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Plus, Trash2, ChevronLeft, ChevronRight, ExternalLink, Download, GraduationCap,
  CalendarDays, ListChecks, Search, Sparkles,
} from 'lucide-react';
import { useCourses } from '@/hooks/useCourses';
import { useToast } from '@/hooks/use-toast';

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

interface Props {
  program: string;
  actionPlan: ActionPlanItem[];
  setActionPlan: React.Dispatch<React.SetStateAction<ActionPlanItem[]>>;
  studyPlanText: string;
  setStudyPlanText: (s: string) => void;
  onExport: () => void;
}

export const StudyPlanCanvas = ({
  program, actionPlan, setActionPlan, studyPlanText, setStudyPlanText, onExport,
}: Props) => {
  const { toast } = useToast();
  const { courses } = useCourses(program);

  // Derive list of terms from items + extras
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

  const openAddDialog = (term: string, placement: Placement) => {
    setAddTerm(term);
    setAddPlacement(placement);
    // Pre-filter by placement
    if (placement === 'LP1') setPeriodChecks({ '1': true, '2': false, '3': false, '4': false });
    else if (placement === 'LP2') setPeriodChecks({ '1': false, '2': true, '3': false, '4': false });
    else if (placement === 'LP3') setPeriodChecks({ '1': false, '2': false, '3': true, '4': false });
    else if (placement === 'LP4') setPeriodChecks({ '1': false, '2': false, '3': false, '4': true });
    else setPeriodChecks({ '1': false, '2': false, '3': false, '4': false });
    setSearch('');
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

  const addCourse = (c: any) => {
    setActionPlan((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).slice(2, 9),
        code: c.code,
        name: c.name,
        hp: Number(c.hp),
        periods: c.periods || [],
        term: addTerm,
        placement: addPlacement,
        studyPace: 100,
      },
    ]);
    toast({ title: 'Tillagd', description: `${c.code} – ${addTerm} ${placementShort(addPlacement)}` });
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

  // Summary calculation
  const summary = useMemo(() => {
    const byTerm: Record<string, { hp: number; pct: number; count: number }> = {};
    let totalHp = 0;
    terms.forEach((t) => { byTerm[t] = { hp: 0, pct: 0, count: 0 }; });
    actionPlan.forEach((it) => {
      const e = effectiveHP(it);
      byTerm[it.term] = byTerm[it.term] || { hp: 0, pct: 0, count: 0 };
      byTerm[it.term].hp += e;
      byTerm[it.term].count += 1;
      totalHp += e;
    });
    Object.values(byTerm).forEach((v) => { v.pct = Math.round((v.hp / 30) * 100); });
    return { byTerm, totalHp };
  }, [actionPlan, terms]);

  const colorFor = (hp: number) => {
    if (hp >= 27 && hp <= 33) return 'hsl(142 71% 45%)';
    if (hp >= 18 && hp <= 36) return 'hsl(38 92% 50%)';
    return 'hsl(0 84% 60%)';
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-primary" />
              Stöd i studieplanering
            </CardTitle>
            <CardDescription>
              Planera kurser per termin och läsperiod. Sammanställning visas till höger.
            </CardDescription>
          </div>
          <div className="flex gap-2 flex-wrap">
            <a href="https://cloud.timeedit.net/lu/web/lth1/" target="_blank" rel="noopener noreferrer">
              <Button size="sm" variant="outline">
                <CalendarDays className="w-4 h-4 mr-1" /> Visa schema i TimeEdit
                <ExternalLink className="w-3 h-3 ml-1" />
              </Button>
            </a>
            <Button size="sm" onClick={onExport}>
              <Download className="w-4 h-4 mr-1" /> Exportera din studieplanering
            </Button>
          </div>
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
              {/* Timeline */}
              <div className="lg:col-span-2 space-y-4">
                {terms.map((t) => (
                  <div key={t} className="border rounded-lg p-3 bg-card">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-bold text-sm">{t}</h4>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground">
                          {summary.byTerm[t]?.hp.toFixed(1).replace(/\.0$/, '')} hp · {summary.byTerm[t]?.pct}%
                        </span>
                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive" onClick={() => removeTerm(t)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                      {PLACEMENT_ORDER.map((p) => {
                        const items = actionPlan.filter((i) => i.term === t && i.placement === p);
                        return (
                          <div key={p} className="border rounded-md p-2 min-h-[90px] bg-muted/30">
                            <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1 font-semibold">
                              {placementShort(p)}
                            </div>
                            <div className="space-y-1">
                              {items.map((it) => (
                                <div key={it.id} className="text-[11px] bg-background border rounded px-1.5 py-1 group relative">
                                  <div className="font-mono text-[10px] text-muted-foreground">{it.code}</div>
                                  <div className="truncate" title={it.name}>{it.name}</div>
                                  <div className="text-primary text-[10px]">
                                    {effectiveHP(it).toFixed(1).replace(/\.0$/, '')} hp
                                    {it.studyPace && it.studyPace !== 100 ? ` (${it.studyPace}%)` : ''}
                                  </div>
                                  <button
                                    onClick={() => removeItem(it.id)}
                                    className="absolute top-0.5 right-0.5 opacity-0 group-hover:opacity-100 text-destructive"
                                    title="Ta bort"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              ))}
                              <button
                                onClick={() => openAddDialog(t, p)}
                                className="w-full text-[10px] py-1 border border-dashed rounded text-muted-foreground hover:border-primary hover:text-primary flex items-center justify-center gap-1"
                              >
                                <Plus className="w-3 h-3" /> Lägg till
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
                <Button variant="outline" size="sm" onClick={addNewTerm}>
                  <Plus className="w-4 h-4 mr-1" /> Lägg till termin ({suggestNextTerm(terms)})
                </Button>
              </div>

              {/* Summary */}
              <div className="space-y-3">
                <Card className="bg-secondary/30">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Sammanställning</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-primary">
                        {summary.totalHp.toFixed(1).replace(/\.0$/, '')}
                      </div>
                      <div className="text-xs text-muted-foreground">totalt hp</div>
                    </div>
                    <div className="space-y-2">
                      {terms.map((t) => {
                        const s = summary.byTerm[t] || { hp: 0, pct: 0, count: 0 };
                        const pct = Math.min(100, s.pct);
                        return (
                          <div key={t} className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="font-medium">{t}</span>
                              <span className="text-muted-foreground">{s.hp.toFixed(1).replace(/\.0$/, '')} hp · {s.pct}%</span>
                            </div>
                            <div className="h-2 bg-muted rounded overflow-hidden">
                              <div className="h-full transition-all" style={{ width: `${pct}%`, backgroundColor: colorFor(s.hp) }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div className="text-[10px] text-muted-foreground pt-2 border-t">
                      Mål: 30 hp/termin (100% studietakt)
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Editable handlingsplan table */}
            {actionPlan.length > 0 && (
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
                            <Input
                              type="number"
                              step="0.5"
                              value={it.hp}
                              onChange={(e) => updateItem(it.id, { hp: parseFloat(e.target.value) || 0 })}
                              className="h-7 text-xs"
                            />
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
            )}
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

      {/* Add course dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <span>Lägg till kurs</span>
              <div className="flex items-center gap-1">
                <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => {
                  const idx = PLACEMENT_ORDER.indexOf(addPlacement);
                  setAddPlacement(PLACEMENT_ORDER[Math.max(0, idx - 1)]);
                }}><ChevronLeft className="w-4 h-4" /></Button>
                <Badge variant="secondary" className="text-sm px-3 py-1">{placementLabel(addPlacement)}</Badge>
                <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => {
                  const idx = PLACEMENT_ORDER.indexOf(addPlacement);
                  setAddPlacement(PLACEMENT_ORDER[Math.min(PLACEMENT_ORDER.length - 1, idx + 1)]);
                }}><ChevronRight className="w-4 h-4" /></Button>
              </div>
              <Badge variant="outline">{addTerm}</Badge>
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

            <div className="md:col-span-2">
              <ScrollArea className="h-80 border rounded">
                <div className="p-1">
                  {filteredCourses.length === 0 && (
                    <p className="text-sm text-muted-foreground p-4 text-center">Inga kurser hittades</p>
                  )}
                  {filteredCourses.map((c) => (
                    <div key={c.id} className="flex items-center justify-between p-2 hover:bg-muted/50 rounded">
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
                      <Button size="sm" variant="outline" onClick={() => addCourse(c)}>
                        Lägg till
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>Stäng</Button>
          </DialogFooter>
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
    </Card>
  );
};