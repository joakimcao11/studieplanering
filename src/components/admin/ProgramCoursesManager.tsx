import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, Plus, Pencil, Trash2, Save, Search, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCourses } from '@/hooks/useCourses';

interface ProgramCoursesManagerProps {
  programCode: string;
  programName: string;
  onBack: () => void;
}

interface CourseForm {
  code: string;
  name: string;
  hp: string;
  level: string;
  year: string;
  periods: string[];
  is_obligatory: boolean;
  is_multi_period: boolean;
  default_study_pace: string;
}

const emptyForm: CourseForm = {
  code: '', name: '', hp: '7.5', level: 'G1', year: '1',
  periods: [], is_obligatory: true, is_multi_period: false, default_study_pace: '',
};

export const ProgramCoursesManager = ({ programCode, programName, onBack }: ProgramCoursesManagerProps) => {
  const { toast } = useToast();
  const { courses, loading, refetch } = useCourses(programCode);
  const { courses: allCourses, loading: allLoading } = useCourses();
  const [dialog, setDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CourseForm>(emptyForm);
  const [reuseSearch, setReuseSearch] = useState('');
  const [reuseDialog, setReuseDialog] = useState(false);
  const [reuseSource, setReuseSource] = useState<any>(null);
  const [reuseForm, setReuseForm] = useState<{ periods: string[]; year: string; is_obligatory: boolean }>({ periods: [], year: '1', is_obligatory: true });

  // Courses from OTHER programs that are not already in this program
  const existingCodes = new Set(courses.map(c => c.code));
  const reusableCourses = allCourses.filter(c =>
    c.program !== programCode &&
    !existingCodes.has(c.code) &&
    (reuseSearch === '' ||
      c.name.toLowerCase().includes(reuseSearch.toLowerCase()) ||
      c.code.toLowerCase().includes(reuseSearch.toLowerCase()))
  );

  const togglePeriod = (period: string) => {
    setForm(prev => ({
      ...prev,
      periods: prev.periods.includes(period)
        ? prev.periods.filter(p => p !== period)
        : [...prev.periods, period].sort(),
    }));
  };

  const openNew = () => {
    setForm(emptyForm);
    setEditingId(null);
    setDialog(true);
  };

  const openEdit = (course: any) => {
    setForm({
      code: course.code,
      name: course.name,
      hp: String(course.hp),
      level: course.level,
      year: String(course.year),
      periods: course.periods || [],
      is_obligatory: course.isObligatory,
      is_multi_period: course.isMultiPeriod || false,
      default_study_pace: course.defaultStudyPace ? String(course.defaultStudyPace) : '',
    });
    setEditingId(course.id);
    setDialog(true);
  };

  const save = async () => {
    const data = {
      code: form.code.trim(),
      name: form.name.trim(),
      hp: parseFloat(form.hp),
      level: form.level,
      year: parseInt(form.year),
      periods: form.periods,
      is_obligatory: form.is_obligatory,
      program: programCode,
      is_multi_period: form.is_multi_period,
      default_study_pace: form.default_study_pace ? parseInt(form.default_study_pace) : null,
    };
    if (!data.code || !data.name || isNaN(data.hp) || data.periods.length === 0) {
      toast({ title: 'Fyll i kod, namn, HP och minst en läsperiod', variant: 'destructive' });
      return;
    }
    let error;
    if (editingId) {
      ({ error } = await supabase.from('courses').update(data).eq('id', editingId));
    } else {
      ({ error } = await supabase.from('courses').insert(data));
    }
    if (error) {
      toast({ title: 'Fel vid sparning', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: editingId ? 'Kurs uppdaterad' : 'Kurs tillagd i programmet' });
      setDialog(false);
      refetch();
    }
  };

  const deleteCourse = async (id: string) => {
    const { error } = await supabase.from('courses').delete().eq('id', id);
    if (!error) {
      toast({ title: 'Kurs borttagen från programmet' });
      refetch();
    }
  };

  const reuseCourse = async (course: any) => {
    const data = {
      code: course.code,
      name: course.name,
      hp: course.hp,
      level: course.level,
      year: course.year,
      periods: course.periods || [],
      is_obligatory: course.isObligatory,
      program: programCode,
      is_multi_period: course.isMultiPeriod || false,
      default_study_pace: course.defaultStudyPace || null,
    };
    const { error } = await supabase.from('courses').insert(data);
    if (error) {
      toast({ title: 'Fel', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: `${course.code} tillagd i ${programCode}` });
      refetch();
    }
  };

  // Group by year
  const coursesByYear: Record<number, typeof courses> = {};
  courses.forEach(c => {
    if (!coursesByYear[c.year]) coursesByYear[c.year] = [];
    coursesByYear[c.year].push(c);
  });
  const years = Object.keys(coursesByYear).map(Number).sort();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-1" />
          Tillbaka
        </Button>
        <h3 className="text-lg font-semibold text-foreground">
          Kurser för {programName} ({programCode})
        </h3>
      </div>

      <Tabs defaultValue="courses">
        <TabsList className="grid w-full grid-cols-2 max-w-sm">
          <TabsTrigger value="courses">Programkurser</TabsTrigger>
          <TabsTrigger value="reuse">Återanvänd kurs</TabsTrigger>
        </TabsList>

        {/* Current courses */}
        <TabsContent value="courses" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">
                  {courses.length} kurser · {courses.reduce((s, c) => s + c.hp, 0)} hp
                </CardTitle>
                <Button onClick={openNew} size="sm">
                  <Plus className="w-4 h-4 mr-1" />
                  Ny kurs
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-muted-foreground text-center py-8">Laddar...</p>
              ) : (
                <ScrollArea className="h-[500px]">
                  <div className="space-y-5">
                    {years.map(year => (
                      <div key={year}>
                        <h4 className="font-semibold text-foreground mb-2">Årskurs {year}</h4>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-24">Kod</TableHead>
                              <TableHead>Namn</TableHead>
                              <TableHead className="w-14">HP</TableHead>
                              <TableHead className="w-14">Nivå</TableHead>
                              <TableHead className="w-24">LP</TableHead>
                              <TableHead className="w-20">Typ</TableHead>
                              <TableHead className="w-20">Åtgärd</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {coursesByYear[year].sort((a, b) => a.code.localeCompare(b.code)).map(c => (
                              <TableRow key={c.id}>
                                <TableCell className="font-mono text-xs">{c.code}</TableCell>
                                <TableCell className="text-sm">{c.name}</TableCell>
                                <TableCell>{c.hp}</TableCell>
                                <TableCell className="text-xs">{c.level}</TableCell>
                                <TableCell className="text-xs">{c.periods?.map(p => `LP${p}`).join(', ')}</TableCell>
                                <TableCell>
                                  <Badge variant={c.isObligatory ? 'secondary' : 'outline'} className="text-xs">
                                    {c.isObligatory ? 'Obl.' : 'Alt.obl'}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <div className="flex gap-1">
                                    <Button size="sm" variant="ghost" onClick={() => openEdit(c)} className="h-7 w-7 p-0">
                                      <Pencil className="w-3 h-3" />
                                    </Button>
                                    <AlertDialog>
                                      <AlertDialogTrigger asChild>
                                        <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:text-destructive">
                                          <Trash2 className="w-3 h-3" />
                                        </Button>
                                      </AlertDialogTrigger>
                                      <AlertDialogContent>
                                        <AlertDialogHeader>
                                          <AlertDialogTitle>Ta bort kurs?</AlertDialogTitle>
                                          <AlertDialogDescription>
                                            Kursen "{c.code} – {c.name}" tas bort permanent från {programCode}.
                                          </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                          <AlertDialogCancel>Avbryt</AlertDialogCancel>
                                          <AlertDialogAction onClick={() => deleteCourse(c.id)}>Ta bort</AlertDialogAction>
                                        </AlertDialogFooter>
                                      </AlertDialogContent>
                                    </AlertDialog>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    ))}
                    {years.length === 0 && (
                      <p className="text-muted-foreground text-center py-8">Inga kurser ännu. Lägg till nya kurser eller återanvänd från andra program.</p>
                    )}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reuse from other programs */}
        <TabsContent value="reuse" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Återanvänd kurser från andra program</CardTitle>
              <p className="text-sm text-muted-foreground">
                Klicka på en kurs för att kopiera den till {programCode}. Årskurs, läsperiod och typ kopieras med.
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Sök bland kurser från andra program..."
                  value={reuseSearch}
                  onChange={e => setReuseSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <ScrollArea className="h-[400px] rounded-md border">
                <div className="p-2 space-y-1">
                  {allLoading ? (
                    <p className="text-sm text-muted-foreground text-center py-4">Laddar...</p>
                  ) : reusableCourses.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">Inga kurser att återanvända</p>
                  ) : (
                    reusableCourses.map(c => (
                      <div
                        key={c.id}
                        className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 cursor-pointer group"
                        onClick={() => reuseCourse(c)}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs text-muted-foreground font-mono">{c.code}</span>
                            <Badge variant="outline" className="text-xs">{c.program}</Badge>
                            <span className="text-xs text-muted-foreground">Åk{c.year}</span>
                            <span className="text-xs text-muted-foreground">
                              LP{c.periods?.join(',')}
                            </span>
                            <Badge variant={c.isObligatory ? 'secondary' : 'outline'} className="text-xs">
                              {c.isObligatory ? 'Obl.' : 'Alt.obl'}
                            </Badge>
                          </div>
                          <p className="text-sm text-foreground">{c.name}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs font-semibold text-primary">{c.hp} hp</span>
                          <Copy className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add/Edit Course Dialog */}
      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Redigera kurs' : `Ny kurs i ${programCode}`}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-sm">Kurskod *</Label>
                <Input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} placeholder="EDAA01" />
              </div>
              <div className="space-y-1">
                <Label className="text-sm">HP *</Label>
                <Input type="number" step="0.5" value={form.hp} onChange={e => setForm(f => ({ ...f, hp: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-sm">Kursnamn *</Label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Programmering, grundkurs" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-sm">Årskurs *</Label>
                <Select value={form.year} onValueChange={v => setForm(f => ({ ...f, year: v }))}>
                  <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-popover border border-border shadow-lg z-50">
                    <SelectItem value="1">Årskurs 1</SelectItem>
                    <SelectItem value="2">Årskurs 2</SelectItem>
                    <SelectItem value="3">Årskurs 3</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-sm">Nivå</Label>
                <Select value={form.level} onValueChange={v => setForm(f => ({ ...f, level: v }))}>
                  <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-popover border border-border shadow-lg z-50">
                    <SelectItem value="G1">G1</SelectItem>
                    <SelectItem value="G2">G2</SelectItem>
                    <SelectItem value="A">A</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm">Läsperioder *</Label>
              <div className="flex gap-3">
                {['1', '2', '3', '4'].map(p => (
                  <label key={p} className="flex items-center gap-1.5 cursor-pointer">
                    <Checkbox
                      checked={form.periods.includes(p)}
                      onCheckedChange={() => togglePeriod(p)}
                    />
                    <span className="text-sm">LP{p}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={form.is_obligatory}
                  onCheckedChange={(v) => setForm(f => ({ ...f, is_obligatory: !!v }))}
                />
                <span className="text-sm">Obligatorisk</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={form.is_multi_period}
                  onCheckedChange={(v) => setForm(f => ({ ...f, is_multi_period: !!v }))}
                />
                <span className="text-sm">Flerperiodskurs</span>
              </label>
            </div>
            {form.is_multi_period && (
              <div className="space-y-1">
                <Label className="text-sm">Studietakt (%)</Label>
                <Select value={form.default_study_pace || '50'} onValueChange={v => setForm(f => ({ ...f, default_study_pace: v }))}>
                  <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-popover border border-border shadow-lg z-50">
                    <SelectItem value="25">25%</SelectItem>
                    <SelectItem value="50">50%</SelectItem>
                    <SelectItem value="75">75%</SelectItem>
                    <SelectItem value="100">100%</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(false)}>Avbryt</Button>
            <Button onClick={save}>
              <Save className="w-4 h-4 mr-1" />
              Spara
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
