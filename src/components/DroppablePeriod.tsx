import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { PlannedCourse, calculatePeriodHP, HP_PER_PERIOD } from '@/types/planning';
import { HPProgressBar } from './HPProgressBar';
import { DraggableCourse } from './DraggableCourse';

interface DroppablePeriodProps {
  id: string;
  title: string;
  courses: PlannedCourse[];
  onRemoveCourse: (courseId: string) => void;
  isEditable?: boolean;
}

export const DroppablePeriod = ({
  id,
  title,
  courses,
  onRemoveCourse,
  isEditable = true,
}: DroppablePeriodProps) => {
  const { setNodeRef, isOver } = useDroppable({ id });
  const totalHP = calculatePeriodHP(courses);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-muted-foreground">{title}</h4>
        <span className="text-sm font-medium">{totalHP} hp</span>
      </div>

      <HPProgressBar current={totalHP} target={HP_PER_PERIOD} showDetails={false} />

      <div
        ref={setNodeRef}
        className={`min-h-[60px] border border-dashed rounded-md p-2 space-y-1 transition-colors ${
          isOver ? 'border-primary bg-primary/5' : 'border-border'
        }`}
      >
        {courses.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-2">
            Dra kurser hit eller lägg till från listan
          </p>
        ) : (
          <SortableContext items={courses.map(c => c.id)} strategy={verticalListSortingStrategy}>
            {courses.map((course) => (
              <DraggableCourse
                key={course.id}
                course={course}
                onRemove={() => onRemoveCourse(course.id)}
                isEditable={isEditable}
              />
            ))}
          </SortableContext>
        )}
      </div>
    </div>
  );
};
