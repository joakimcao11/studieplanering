import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, GripVertical } from 'lucide-react';
import { PlannedCourse } from '@/types/planning';
import { cn } from '@/lib/utils';

interface DraggableCourseProps {
  course: PlannedCourse;
  onRemove: () => void;
  isEditable?: boolean;
}

export const DraggableCourse = ({ course, onRemove, isEditable = true }: DraggableCourseProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: course.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const isNonStandardPace = course.studyPace && course.studyPace !== 100;
  const isRestkurs = course.completedHP && course.completedHP > 0;
  const remainingHP = isRestkurs ? Math.max(0, course.hp - course.completedHP!) : course.hp;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center justify-between p-2 bg-secondary/50 rounded text-sm group",
        isNonStandardPace && "border-l-4 border-warning",
        isRestkurs && "border-l-4 border-orange-500"
      )}
    >
      {isEditable && (
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 hover:bg-secondary rounded mr-1"
        >
          <GripVertical className="w-3 h-3 text-muted-foreground" />
        </button>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1 flex-wrap">
          <span className="text-xs text-muted-foreground font-mono">
            {course.code}
          </span>
          {course.isCustom && (
            <Badge variant="outline" className="text-xs py-0">
              Egen
            </Badge>
          )}
          {course.isMultiPeriod && (
            <Badge variant="outline" className="text-xs py-0 bg-warning/20 text-warning-foreground border-warning">
              *Flerperiod
            </Badge>
          )}
          {isNonStandardPace && (
            <Badge variant="secondary" className="text-xs py-0 bg-primary/20">
              {course.studyPace}%
            </Badge>
          )}
          {isRestkurs && (
            <Badge variant="outline" className="text-xs py-0 bg-orange-100 text-orange-800 border-orange-400">
              *Restkurs ({course.completedHP} hp avklarade)
            </Badge>
          )}
        </div>
        <p className={cn(
          "text-sm truncate text-foreground",
          isNonStandardPace && "font-bold"
        )}>
          {course.isMultiPeriod && <span className="font-bold">*</span>}
          {course.name}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-primary">
          {isRestkurs 
            ? `${remainingHP} hp kvar`
            : course.studyPace && course.studyPace !== 100 
              ? `${(course.hp * course.studyPace / 100).toFixed(2).replace(/\.?0+$/, '')} hp`
              : `${course.hp} hp`}
        </span>
        {isEditable && (
          <Button
            size="sm"
            variant="ghost"
            onClick={onRemove}
            className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <X className="w-3 h-3" />
          </Button>
        )}
      </div>
    </div>
  );
};
