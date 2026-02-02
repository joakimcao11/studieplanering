import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Plus, BookOpen, PenLine } from 'lucide-react';
import { Course, getAllCourses } from '@/data/courses';
import { Program, PlannedCourse } from '@/types/planning';

interface CourseSelectorProps {
  program: Program;
  onAddCourse: (course: PlannedCourse) => void;
}

export const CourseSelector = ({ program, onAddCourse }: CourseSelectorProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'obligatory'>('all');
  const [customCourseName, setCustomCourseName] = useState('');
  const [customCourseHP, setCustomCourseHP] = useState<number | ''>('');

  const courses = getAllCourses(program);
  
  const filteredCourses = courses.filter((course) => {
    const matchesSearch = 
      course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterType === 'all' || course.isObligatory;
    return matchesSearch && matchesFilter;
  });

  const handleAddProgramCourse = (course: Course) => {
    onAddCourse({
      id: '',
      courseId: course.id,
      code: course.code,
      name: course.name,
      hp: course.hp,
      isCustom: false,
    });
  };

  const handleAddCustomCourse = () => {
    if (!customCourseName.trim() || !customCourseHP) return;
    
    onAddCourse({
      id: '',
      courseId: `custom-${Date.now()}`,
      code: 'EGEN',
      name: customCourseName.trim(),
      hp: Number(customCourseHP),
      isCustom: true,
    });
    
    setCustomCourseName('');
    setCustomCourseHP('');
  };

  const handleQuickHP = (hp: number) => {
    setCustomCourseHP(hp);
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-primary" />
          Lägg till kurs
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs defaultValue="program" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="program">Programkurser</TabsTrigger>
            <TabsTrigger value="custom">Egen kurs</TabsTrigger>
          </TabsList>

          <TabsContent value="program" className="space-y-3 mt-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Sök kurs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Filter */}
            <div className="flex gap-2">
              <Button
                variant={filterType === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterType('all')}
              >
                Alla
              </Button>
              <Button
                variant={filterType === 'obligatory' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterType('obligatory')}
              >
                Obligatoriska
              </Button>
            </div>

            {/* Course List */}
            <ScrollArea className="h-64 rounded-md border">
              <div className="p-2 space-y-1">
                {filteredCourses.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Inga kurser hittades
                  </p>
                ) : (
                  filteredCourses.map((course) => (
                    <div
                      key={course.id}
                      className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 group"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground font-mono">
                            {course.code}
                          </span>
                          {course.isObligatory && (
                            <Badge variant="secondary" className="text-xs">
                              Obl.
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
                          onClick={() => handleAddProgramCourse(course)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="custom" className="space-y-4 mt-3">
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="customName">Kursnamn</Label>
                <div className="relative">
                  <PenLine className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="customName"
                    placeholder="Ange kursnamn"
                    value={customCourseName}
                    onChange={(e) => setCustomCourseName(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Antal hp</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={customCourseHP === 7.5 ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleQuickHP(7.5)}
                  >
                    7,5 hp
                  </Button>
                  <Button
                    type="button"
                    variant={customCourseHP === 15 ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleQuickHP(15)}
                  >
                    15 hp
                  </Button>
                  <Input
                    type="number"
                    placeholder="Annat"
                    value={customCourseHP}
                    onChange={(e) => setCustomCourseHP(e.target.value ? Number(e.target.value) : '')}
                    className="w-24"
                    min={0}
                    step={0.5}
                  />
                </div>
              </div>

              <Button
                onClick={handleAddCustomCourse}
                disabled={!customCourseName.trim() || !customCourseHP}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Lägg till egen kurs
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
