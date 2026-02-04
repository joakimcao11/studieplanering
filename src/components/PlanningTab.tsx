import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, FileText, ArrowRight } from 'lucide-react';
import { TermPlan, PlannedCourse, Program } from '@/types/planning';
import { TermCard } from './TermCard';
import { CourseSelector } from './CourseSelector';
import {
  DndContext,
  DragEndEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  DragOverlay,
} from '@dnd-kit/core';
import { Badge } from '@/components/ui/badge';

interface PlanningTabProps {
  program: Program;
  terms: TermPlan[];
  notes: string;
  onAddTerm: () => void;
  onRemoveTerm: (termId: string) => void;
  onAddCourse: (termId: string, period: 'lp1' | 'lp2', course: PlannedCourse) => void;
  onRemoveCourse: (termId: string, period: 'lp1' | 'lp2', courseId: string) => void;
  onUpdateTerm: (termId: string, updates: Partial<TermPlan>) => void;
  onNotesChange: (notes: string) => void;
  onTermsChange: (terms: TermPlan[]) => void;
  onNextTab?: () => void;
}

export const PlanningTab = ({
  program,
  terms,
  notes,
  onAddTerm,
  onRemoveTerm,
  onAddCourse,
  onRemoveCourse,
  onUpdateTerm,
  onNotesChange,
  onTermsChange,
  onNextTab,
}: PlanningTabProps) => {
  // Find spring term 2026, or fall back to first term
  const getDefaultTermId = () => {
    const springTerm2026 = terms.find(t => t.semester === 'VT' && (t.year === '2026' || t.customYearLabel === '2026'));
    return springTerm2026?.id || terms[0]?.id || '';
  };

  const [selectedTermId, setSelectedTermId] = useState<string>(getDefaultTermId());
  const [selectedPeriod, setSelectedPeriod] = useState<'lp1' | 'lp2'>('lp1'); // lp1 = LP3 for VT
  const [activeCourse, setActiveCourse] = useState<PlannedCourse | null>(null);
  
  // New term creation state
  const [newTermSemester, setNewTermSemester] = useState<'HT' | 'VT'>('VT');
  const [newTermYear, setNewTermYear] = useState<string>('2026');

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Update selected term if it no longer exists
  useEffect(() => {
    if (!terms.find(t => t.id === selectedTermId) && terms.length > 0) {
      setSelectedTermId(terms[0].id);
    }
  }, [terms, selectedTermId]);

  const handleAddCourse = (course: PlannedCourse) => {
    if (!selectedTermId) return;
    onAddCourse(selectedTermId, selectedPeriod, course);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    // Find the course being dragged
    for (const term of terms) {
      const lp1Course = term.lp1.find(c => c.id === active.id);
      if (lp1Course) {
        setActiveCourse(lp1Course);
        return;
      }
      const lp2Course = term.lp2.find(c => c.id === active.id);
      if (lp2Course) {
        setActiveCourse(lp2Course);
        return;
      }
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveCourse(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Find source term and period
    let sourceTerm: TermPlan | null = null;
    let sourcePeriod: 'lp1' | 'lp2' | null = null;
    let draggedCourse: PlannedCourse | null = null;

    for (const term of terms) {
      const lp1Course = term.lp1.find(c => c.id === activeId);
      if (lp1Course) {
        sourceTerm = term;
        sourcePeriod = 'lp1';
        draggedCourse = lp1Course;
        break;
      }
      const lp2Course = term.lp2.find(c => c.id === activeId);
      if (lp2Course) {
        sourceTerm = term;
        sourcePeriod = 'lp2';
        draggedCourse = lp2Course;
        break;
      }
    }

    if (!sourceTerm || !sourcePeriod || !draggedCourse) return;

    // Parse target from overId (format: "termId-lp1" or "termId-lp2")
    const [targetTermId, targetPeriodStr] = overId.split('-lp');
    if (!targetPeriodStr) return;
    
    const targetPeriod = `lp${targetPeriodStr}` as 'lp1' | 'lp2';

    // If dropping in the same place, do nothing
    if (sourceTerm.id === targetTermId && sourcePeriod === targetPeriod) return;

    // Update terms
    const newTerms = terms.map(term => {
      // Remove from source
      if (term.id === sourceTerm!.id) {
        return {
          ...term,
          [sourcePeriod!]: term[sourcePeriod!].filter(c => c.id !== activeId),
        };
      }
      return term;
    }).map(term => {
      // Add to target
      if (term.id === targetTermId) {
        return {
          ...term,
          [targetPeriod]: [...term[targetPeriod], draggedCourse!],
        };
      }
      return term;
    });

    onTermsChange(newTerms);
  };

  const handleAddNewTerm = () => {
    if (newTermYear) {
      // Custom add with year
      const newTerm: TermPlan = {
        id: Math.random().toString(36).substring(2, 9),
        semester: newTermSemester,
        year: newTermYear,
        customYearLabel: newTermYear,
        customSemesterLabel: '',
        lp1: [],
        lp2: [],
        retakeExamNotes: '',
      };
      onTermsChange([...terms, newTerm]);
      setNewTermYear('');
    } else {
      onAddTerm();
    }
  };

  const selectedTerm = terms.find(t => t.id === selectedTermId);
  const periodLabel = selectedTerm 
    ? (selectedTerm.semester === 'HT' 
        ? (selectedPeriod === 'lp1' ? 'LP1' : 'LP2')
        : (selectedPeriod === 'lp1' ? 'LP3' : 'LP4'))
    : '';

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Course Selector with integrated target selection */}
          <div className="lg:col-span-1 space-y-4">
            {/* Target Selection Card - Integrated with Course Selector */}
            <Card className="border-primary/30 bg-primary/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-foreground font-bold">
                  Välj var kursen ska placeras
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-foreground">Välj termin</Label>
                  <Select value={selectedTermId} onValueChange={setSelectedTermId}>
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Välj termin" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border border-border shadow-lg z-50">
                      {terms.map((term) => {
                        const label = term.customSemesterLabel || (term.semester === 'HT' ? 'Hösttermin' : 'Vårtermin');
                        return (
                          <SelectItem key={term.id} value={term.id}>
                            {label} {term.customYearLabel || term.year}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-foreground">Välj läsperiod</Label>
                  <Select value={selectedPeriod} onValueChange={(v) => setSelectedPeriod(v as 'lp1' | 'lp2')}>
                    <SelectTrigger className="bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border border-border shadow-lg z-50">
                      <SelectItem value="lp1">
                        {selectedTerm?.semester === 'HT' ? 'LP1' : 'LP3'}
                      </SelectItem>
                      <SelectItem value="lp2">
                        {selectedTerm?.semester === 'HT' ? 'LP2' : 'LP4'}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Badge variant="secondary" className="text-sm py-2 px-4 w-full justify-center">
                  Kurser läggs till i <span className="font-bold text-primary ml-1">{periodLabel}</span>
                </Badge>
              </CardContent>
            </Card>

            <CourseSelector 
              program={program} 
              onAddCourse={handleAddCourse}
            />
          </div>

          {/* Right Column - Terms and Notes */}
          <div className="lg:col-span-2 space-y-4">
            {/* Terms */}
            {terms.map((term) => (
              <TermCard
                key={term.id}
                term={term}
                onRemoveTerm={() => onRemoveTerm(term.id)}
                onRemoveCourse={(period, courseId) => onRemoveCourse(term.id, period, courseId)}
                onUpdateTerm={(updates) => onUpdateTerm(term.id, updates)}
                onAddCourse={(period, course) => onAddCourse(term.id, period, course)}
                canRemove={terms.length > 1}
                isEditable={true}
              />
            ))}

            {/* Add Term Section */}
            <Card className="border-dashed">
              <CardContent className="pt-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Termin</Label>
                    <Select value={newTermSemester} onValueChange={(v) => setNewTermSemester(v as 'HT' | 'VT')}>
                      <SelectTrigger className="bg-background h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-popover border border-border shadow-lg z-50">
                        <SelectItem value="HT">Hösttermin</SelectItem>
                        <SelectItem value="VT">Vårtermin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">År (valfritt)</Label>
                    <Input
                      value={newTermYear}
                      onChange={(e) => setNewTermYear(e.target.value)}
                      placeholder="t.ex. 2025"
                      className="h-9"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Button
                      variant="outline"
                      className="w-full h-9"
                      onClick={handleAddNewTerm}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Lägg till termin
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Notes */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2 text-foreground font-bold">
                  <FileText className="w-4 h-4 text-primary" />
                  Övriga anteckningar
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Anteckna övrigt som diskuteras under samtalet..."
                  value={notes}
                  onChange={(e) => onNotesChange(e.target.value)}
                  rows={4}
                  className="resize-none"
                />
              </CardContent>
            </Card>

            {/* Navigation Button */}
            {onNextTab && (
              <div className="flex justify-end pt-4">
                <Button onClick={onNextTab} size="lg">
                  Fortsätt till Överblick & Export
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <DragOverlay>
        {activeCourse ? (
          <div className="p-2 bg-background border border-primary rounded shadow-lg text-sm">
            <span className="font-mono text-xs text-muted-foreground">{activeCourse.code}</span>
            <span className="ml-2 text-foreground">{activeCourse.name}</span>
            <span className="ml-2 text-primary font-medium">{activeCourse.hp} hp</span>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};
