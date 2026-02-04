import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { PlannedCourse, calculatePeriodHP, HP_PER_PERIOD, StudyPace } from '@/types/planning';
import { HPProgressBar } from './HPProgressBar';
import { DraggableCourse } from './DraggableCourse';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, X } from 'lucide-react';

interface DroppablePeriodProps {
  id: string;
  title: string;
  courses: PlannedCourse[];
  onRemoveCourse: (courseId: string) => void;
  onAddCustomCourse?: (course: PlannedCourse) => void;
  isEditable?: boolean;
}

export const DroppablePeriod = ({
  id,
  title,
  courses,
  onRemoveCourse,
  onAddCustomCourse,
  isEditable = true,
}: DroppablePeriodProps) => {
  const { setNodeRef, isOver } = useDroppable({ id });
  const totalHP = calculatePeriodHP(courses);
  
  const [showCustomForm, setShowCustomForm] = useState(false);
  const [customCode, setCustomCode] = useState('');
  const [customName, setCustomName] = useState('');
  const [customHP, setCustomHP] = useState('');
  const [customPace, setCustomPace] = useState<StudyPace>(100);

  const handleAddCustomCourse = () => {
    if (!customCode.trim() || !customName.trim() || !customHP.trim()) return;
    
    const hp = parseFloat(customHP);
    if (isNaN(hp) || hp <= 0) return;
    
    const newCourse: PlannedCourse = {
      id: Math.random().toString(36).substring(2, 9),
      courseId: `custom-${Date.now()}`,
      code: customCode.trim(),
      name: customName.trim(),
      hp: hp,
      isCustom: true,
      studyPace: customPace,
      isMultiPeriod: customPace < 100,
    };
    
    onAddCustomCourse?.(newCourse);
    
    // Reset form
    setCustomCode('');
    setCustomName('');
    setCustomHP('');
    setCustomPace(100);
    setShowCustomForm(false);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-foreground">{title}</h4>
        <span className="text-sm font-medium text-foreground">{totalHP.toFixed(1).replace(/\.0$/, '')} hp</span>
      </div>

      <HPProgressBar current={totalHP} target={HP_PER_PERIOD} showDetails={false} />

      <div
        ref={setNodeRef}
        className={`min-h-[60px] border border-dashed rounded-md p-2 space-y-1 transition-colors ${
          isOver ? 'border-primary bg-primary/5' : 'border-border'
        }`}
      >
        {courses.length === 0 && !showCustomForm ? (
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
        
        {/* Custom Course Form */}
        {isEditable && showCustomForm && (
          <div className="mt-2 p-2 bg-muted/50 rounded border border-border space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-foreground">Lägg till egen kurs</span>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowCustomForm(false)}
                className="h-5 w-5 p-0"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-1">
              <Input
                placeholder="Kurskod"
                value={customCode}
                onChange={(e) => setCustomCode(e.target.value)}
                className="h-7 text-xs"
              />
              <Input
                placeholder="HP"
                type="number"
                step="0.5"
                min="0"
                value={customHP}
                onChange={(e) => setCustomHP(e.target.value)}
                className="h-7 text-xs"
              />
            </div>
            <Input
              placeholder="Kursnamn"
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              className="h-7 text-xs"
            />
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Studietakt:</span>
              <Select value={customPace.toString()} onValueChange={(v) => setCustomPace(parseInt(v) as StudyPace)}>
                <SelectTrigger className="h-7 text-xs flex-1 bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border border-border shadow-lg z-50">
                  <SelectItem value="100">100%</SelectItem>
                  <SelectItem value="75">75%</SelectItem>
                  <SelectItem value="50">50%</SelectItem>
                  <SelectItem value="25">25%</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              size="sm"
              onClick={handleAddCustomCourse}
              disabled={!customCode.trim() || !customName.trim() || !customHP.trim()}
              className="w-full h-7 text-xs"
            >
              <Plus className="w-3 h-3 mr-1" />
              Lägg till
            </Button>
          </div>
        )}
        
        {/* Add Custom Course Button */}
        {isEditable && !showCustomForm && onAddCustomCourse && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowCustomForm(true)}
            className="w-full h-7 text-xs text-muted-foreground hover:text-foreground mt-1"
          >
            <Plus className="w-3 h-3 mr-1" />
            Lägg till egen kurs
          </Button>
        )}
      </div>
    </div>
  );
};
