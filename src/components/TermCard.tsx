import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Calendar, Edit2 } from 'lucide-react';
import { TermPlan, PlannedCourse, HP_PER_TERM, calculatePeriodHP, calculateTermHP } from '@/types/planning';
import { HPProgressBar } from './HPProgressBar';
import { DroppablePeriod } from './DroppablePeriod';
import { useState } from 'react';

interface TermCardProps {
  term: TermPlan;
  onRemoveTerm: () => void;
  onRemoveCourse: (period: 'lp1' | 'lp2', courseId: string) => void;
  onUpdateTerm: (updates: Partial<TermPlan>) => void;
  onAddCourse?: (period: 'lp1' | 'lp2', course: PlannedCourse) => void;
  canRemove: boolean;
  isEditable?: boolean;
}

export const TermCard = ({ 
  term, 
  onRemoveTerm, 
  onRemoveCourse, 
  onUpdateTerm,
  onAddCourse,
  canRemove,
  isEditable = true,
}: TermCardProps) => {
  const [isEditingYear, setIsEditingYear] = useState(false);
  const [isEditingSemester, setIsEditingSemester] = useState(false);
  const [yearInput, setYearInput] = useState(term.customYearLabel || term.year);
  
  const defaultSemesterLabel = term.semester === 'HT' ? 'Hösttermin' : 'Vårtermin';
  const semesterLabel = term.customSemesterLabel || defaultSemesterLabel;
  const period1Label = term.semester === 'HT' ? 'LP1' : 'LP3';
  const period2Label = term.semester === 'HT' ? 'LP2' : 'LP4';
  
  const totalTermHP = calculateTermHP(term);
  const displayYear = term.customYearLabel || term.year;

  const handleYearSave = () => {
    onUpdateTerm({ customYearLabel: yearInput });
    setIsEditingYear(false);
  };

  const handleSemesterTypeChange = (value: 'HT' | 'VT') => {
    onUpdateTerm({ semester: value, customSemesterLabel: '' });
  };

  return (
    <Card className="relative">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isEditingSemester ? (
              <div className="flex items-center gap-2">
                <Select 
                  value={term.semester} 
                  onValueChange={(v) => handleSemesterTypeChange(v as 'HT' | 'VT')}
                >
                  <SelectTrigger className="w-32 h-8 text-sm bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border border-border shadow-lg z-50">
                    <SelectItem value="HT">Hösttermin</SelectItem>
                    <SelectItem value="VT">Vårtermin</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  value={term.customSemesterLabel}
                  onChange={(e) => onUpdateTerm({ customSemesterLabel: e.target.value })}
                  className="w-28 h-8 text-sm"
                  placeholder="Egen text..."
                />
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsEditingSemester(false)}
                  className="h-8 px-2"
                >
                  Klar
                </Button>
              </div>
            ) : (
              <button
                onClick={() => isEditable && setIsEditingSemester(true)}
                className="flex items-center gap-1 text-base font-semibold hover:text-primary transition-colors"
              >
                {semesterLabel}
                {isEditable && <Edit2 className="w-3 h-3 text-muted-foreground" />}
              </button>
            )}
            
            {!isEditingSemester && (
              isEditingYear ? (
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
              )
            )}
          </div>
          <div className="flex items-center gap-2">
            <Badge 
              variant={Math.abs(totalTermHP - HP_PER_TERM) < 0.1 ? 'default' : 'secondary'}
              className="text-xs"
            >
              {totalTermHP.toFixed(1).replace(/\.0$/, '')} / {HP_PER_TERM} hp
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
          <DroppablePeriod
            id={`${term.id}-lp1`}
            title={period1Label}
            courses={term.lp1}
            onRemoveCourse={(id) => onRemoveCourse('lp1', id)}
            onAddCustomCourse={onAddCourse ? (course) => onAddCourse('lp1', course) : undefined}
            isEditable={isEditable}
          />
          <DroppablePeriod
            id={`${term.id}-lp2`}
            title={period2Label}
            courses={term.lp2}
            onRemoveCourse={(id) => onRemoveCourse('lp2', id)}
            onAddCustomCourse={onAddCourse ? (course) => onAddCourse('lp2', course) : undefined}
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
