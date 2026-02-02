import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, X, Calendar } from 'lucide-react';
import { TermPlan, PlannedCourse, RetakeExamPeriod, calculatePeriodHP, HP_PER_PERIOD, HP_PER_TERM } from '@/types/planning';
import { HPProgressBar } from './HPProgressBar';

interface TermCardProps {
  term: TermPlan;
  onRemoveTerm: () => void;
  onRemoveCourse: (period: 'lp1' | 'lp2', courseId: string) => void;
  onSetRetakeExam: (period: RetakeExamPeriod) => void;
  canRemove: boolean;
}

const PeriodSection = ({ 
  title, 
  courses, 
  onRemoveCourse 
}: { 
  title: string;
  courses: PlannedCourse[];
  onRemoveCourse: (courseId: string) => void;
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
            Dra hit kurser eller lägg till från listan
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
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => onRemoveCourse(course.id)}
                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                >
                  <X className="w-3 h-3" />
                </Button>
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
  onSetRetakeExam,
  canRemove 
}: TermCardProps) => {
  const semesterLabel = term.semester === 'HT' ? 'Hösttermin' : 'Vårtermin';
  const period1Label = term.semester === 'HT' ? 'LP1' : 'LP3';
  const period2Label = term.semester === 'HT' ? 'LP2' : 'LP4';
  
  const totalTermHP = calculatePeriodHP(term.lp1) + calculatePeriodHP(term.lp2);

  return (
    <Card className="relative">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">
            {semesterLabel} {term.year}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge 
              variant={totalTermHP === HP_PER_TERM ? 'default' : 'secondary'}
              className="text-xs"
            >
              {totalTermHP} / {HP_PER_TERM} hp
            </Badge>
            {canRemove && (
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
          />
          <PeriodSection
            title={period2Label}
            courses={term.lp2}
            onRemoveCourse={(id) => onRemoveCourse('lp2', id)}
          />
        </div>

        {/* Retake Exam Period */}
        <div className="pt-2 border-t border-border">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Omtentamensperiod:</span>
            <Select
              value={term.retakeExam || 'none'}
              onValueChange={(value) => onSetRetakeExam(value === 'none' ? null : value as RetakeExamPeriod)}
            >
              <SelectTrigger className="w-32 h-8 text-sm bg-background">
                <SelectValue placeholder="Välj" />
              </SelectTrigger>
              <SelectContent className="bg-popover border border-border shadow-lg z-50">
                <SelectItem value="none">Ingen</SelectItem>
                <SelectItem value="april">April</SelectItem>
                <SelectItem value="augusti">Augusti</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
