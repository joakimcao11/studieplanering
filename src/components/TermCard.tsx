import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Trash2, X, Calendar, Edit2 } from 'lucide-react';
import { TermPlan, PlannedCourse, calculatePeriodHP, HP_PER_PERIOD, HP_PER_TERM } from '@/types/planning';
import { HPProgressBar } from './HPProgressBar';
import { useState } from 'react';

interface TermCardProps {
  term: TermPlan;
  onRemoveTerm: () => void;
  onRemoveCourse: (period: 'lp1' | 'lp2', courseId: string) => void;
  onUpdateTerm: (updates: Partial<TermPlan>) => void;
  canRemove: boolean;
  isEditable?: boolean;
}

const PeriodSection = ({ 
  title, 
  courses, 
  onRemoveCourse,
  isEditable = true,
}: { 
  title: string;
  courses: PlannedCourse[];
  onRemoveCourse: (courseId: string) => void;
  isEditable?: boolean;
}) => {
  const totalHP = calculatePeriodHP(courses);
  
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-muted-foreground">{title}</h4>
        <span className="text-sm font-medium">{totalHP} hp</span>
      </div>
      
      <HPProgressBar 
        current={totalHP} 
        target={HP_PER_PERIOD} 
        showDetails={false}
      />
      
      <div className="min-h-[60px] border border-dashed border-border rounded-md p-2 space-y-1">
        {courses.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-2">
            Lägg till kurser från listan till vänster
          </p>
        ) : (
          courses.map((course) => (
            <div
              key={course.id}
              className="flex items-center justify-between p-2 bg-secondary/50 rounded text-sm group"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <span className="text-xs text-muted-foreground font-mono">
                    {course.code}
                  </span>
                  {course.isCustom && (
                    <Badge variant="outline" className="text-xs py-0">
                      Egen
                    </Badge>
                  )}
                </div>
                <p className="text-sm truncate">{course.name}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-primary">
                  {course.hp} hp
                </span>
                {isEditable && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onRemoveCourse(course.id)}
                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export const TermCard = ({ 
  term, 
  onRemoveTerm, 
  onRemoveCourse, 
  onUpdateTerm,
  canRemove,
  isEditable = true,
}: TermCardProps) => {
  const [isEditingYear, setIsEditingYear] = useState(false);
  const [yearInput, setYearInput] = useState(term.customYearLabel || term.year);
  
  const semesterLabel = term.semester === 'HT' ? 'Hösttermin' : 'Vårtermin';
  const period1Label = term.semester === 'HT' ? 'LP1' : 'LP3';
  const period2Label = term.semester === 'HT' ? 'LP2' : 'LP4';
  
  const totalTermHP = calculatePeriodHP(term.lp1) + calculatePeriodHP(term.lp2);

  const displayYear = term.customYearLabel || term.year;

  const handleYearSave = () => {
    onUpdateTerm({ customYearLabel: yearInput });
    setIsEditingYear(false);
  };

  return (
    <Card className="relative">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base">
              {semesterLabel}{' '}
            </CardTitle>
            {isEditingYear ? (
              <div className="flex items-center gap-1">
                <Input
                  value={yearInput}
                  onChange={(e) => setYearInput(e.target.value)}
                  className="w-24 h-7 text-sm"
                  placeholder="År"
                  onBlur={handleYearSave}
                  onKeyDown={(e) => e.key === 'Enter' && handleYearSave()}
                  autoFocus
                />
              </div>
            ) : (
              <button
                onClick={() => isEditable && setIsEditingYear(true)}
                className="flex items-center gap-1 text-base font-semibold hover:text-primary transition-colors"
              >
                {displayYear}
                {isEditable && <Edit2 className="w-3 h-3 text-muted-foreground" />}
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Badge 
              variant={totalTermHP === HP_PER_TERM ? 'default' : 'secondary'}
              className="text-xs"
            >
              {totalTermHP} / {HP_PER_TERM} hp
            </Badge>
            {canRemove && isEditable && (
              <Button
                size="sm"
                variant="ghost"
                onClick={onRemoveTerm}
                className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
        <HPProgressBar 
          current={totalTermHP} 
          target={HP_PER_TERM}
          showDetails={true}
        />
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <PeriodSection
            title={period1Label}
            courses={term.lp1}
            onRemoveCourse={(id) => onRemoveCourse('lp1', id)}
            isEditable={isEditable}
          />
          <PeriodSection
            title={period2Label}
            courses={term.lp2}
            onRemoveCourse={(id) => onRemoveCourse('lp2', id)}
            isEditable={isEditable}
          />
        </div>

        {/* Retake Exam Notes */}
        <div className="pt-2 border-t border-border">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <Label className="text-sm text-muted-foreground">
                Omtentamensperiod (april/augusti)
              </Label>
            </div>
            <Textarea
              placeholder="Skriv anteckningar om omtentor här..."
              value={term.retakeExamNotes}
              onChange={(e) => onUpdateTerm({ retakeExamNotes: e.target.value })}
              rows={2}
              className="resize-none text-sm"
              disabled={!isEditable}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
