import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, GripVertical } from 'lucide-react';
import { PlannedCourse } from '@/types/planning';

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

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between p-2 bg-secondary/50 rounded text-sm group"
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
