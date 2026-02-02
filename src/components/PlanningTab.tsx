import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, FileText } from 'lucide-react';
import { TermPlan, PlannedCourse, RetakeExamPeriod, Program } from '@/types/planning';
import { TermCard } from './TermCard';
import { CourseSelector } from './CourseSelector';

interface PlanningTabProps {
  program: Program;
  terms: TermPlan[];
  notes: string;
  onAddTerm: () => void;
  onRemoveTerm: (termId: string) => void;
  onAddCourse: (termId: string, period: 'lp1' | 'lp2', course: PlannedCourse) => void;
  onRemoveCourse: (termId: string, period: 'lp1' | 'lp2', courseId: string) => void;
  onSetRetakeExam: (termId: string, period: RetakeExamPeriod) => void;
  onNotesChange: (notes: string) => void;
}

export const PlanningTab = ({
  program,
  terms,
  notes,
  onAddTerm,
  onRemoveTerm,
  onAddCourse,
  onRemoveCourse,
  onSetRetakeExam,
  onNotesChange,
}: PlanningTabProps) => {
  const [selectedTermId, setSelectedTermId] = useState<string>(terms[0]?.id || '');
  const [selectedPeriod, setSelectedPeriod] = useState<'lp1' | 'lp2'>('lp1');

  const handleAddCourse = (course: PlannedCourse) => {
    if (!selectedTermId) return;
    onAddCourse(selectedTermId, selectedPeriod, course);
  };

  const selectedTerm = terms.find(t => t.id === selectedTermId);
  const periodLabel = selectedTerm 
    ? (selectedTerm.semester === 'HT' 
        ? (selectedPeriod === 'lp1' ? 'LP1' : 'LP2')
        : (selectedPeriod === 'lp1' ? 'LP3' : 'LP4'))
    : '';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Column - Course Selector */}
      <div className="lg:col-span-1 space-y-4">
        <CourseSelector 
          program={program} 
          onAddCourse={handleAddCourse}
        />
        
        {/* Target selection */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Lägg till i</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Termin</Label>
              <Select value={selectedTermId} onValueChange={setSelectedTermId}>
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Välj termin" />
                </SelectTrigger>
                <SelectContent className="bg-popover border border-border shadow-lg z-50">
                  {terms.map((term) => (
                    <SelectItem key={term.id} value={term.id}>
                      {term.semester === 'HT' ? 'Hösttermin' : 'Vårtermin'} {term.year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Läsperiod</Label>
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
            
            <p className="text-xs text-muted-foreground">
              Kurser läggs till i <span className="font-medium">{periodLabel}</span>
            </p>
          </CardContent>
        </Card>
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
            onSetRetakeExam={(period) => onSetRetakeExam(term.id, period)}
            canRemove={terms.length > 1}
          />
        ))}

        {/* Add Term Button */}
        <Button
          variant="outline"
          className="w-full border-dashed"
          onClick={onAddTerm}
        >
          <Plus className="w-4 h-4 mr-2" />
          Lägg till termin
        </Button>

        {/* Notes */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
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
      </div>
    </div>
  );
};
