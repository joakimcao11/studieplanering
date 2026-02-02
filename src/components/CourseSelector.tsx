import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Plus, BookOpen, PenLine, GraduationCap } from 'lucide-react';
import { Course, getAllCourses } from '@/data/courses';
import { Program, PlannedCourse } from '@/types/planning';

interface CourseSelectorProps {
  program: Program;
  onAddCourse: (course: PlannedCourse) => void;
}

type FilterType = 'all' | 'obligatory';
type PeriodFilter = 'all' | '1' | '2' | '3' | '4';

export const CourseSelector = ({ program, onAddCourse }: CourseSelectorProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('all');
  const [customCourseName, setCustomCourseName] = useState('');
  const [customCourseCode, setCustomCourseCode] = useState('');
  const [customCourseHpType, setCustomCourseHpType] = useState<string>('7.5');
  const [customCourseHP, setCustomCourseHP] = useState<string>('');

  const courses = getAllCourses(program);
  
  const filteredCourses = courses.filter((course) => {
    const matchesSearch = 
      course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterType === 'all' || course.isObligatory;
    const matchesPeriod = periodFilter === 'all' || 
      (course.periods && course.periods.includes(periodFilter));
    return matchesSearch && matchesFilter && matchesPeriod;
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
    if (!customCourseName.trim()) return;
    
    const hp = customCourseHpType === 'custom' 
      ? parseFloat(customCourseHP) || 7.5
      : parseFloat(customCourseHpType);
    
    onAddCourse({
      id: '',
      courseId: `custom-${Date.now()}`,
      code: customCourseCode.trim() || 'EGEN',
      name: customCourseName.trim(),
      hp: hp,
      isCustom: true,
    });
    
    setCustomCourseName('');
    setCustomCourseCode('');
    setCustomCourseHpType('7.5');
    setCustomCourseHP('');
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

            {/* Filter Type */}
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

            {/* Period Filter */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Läsperiod</Label>
              <div className="flex flex-wrap gap-2">
                <Badge 
                  variant={periodFilter === 'all' ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => setPeriodFilter('all')}
                >
                  Alla
                </Badge>
                {['1', '2', '3', '4'].map((period) => (
                  <Badge 
                    key={period}
                    variant={periodFilter === period ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => setPeriodFilter(period as PeriodFilter)}
                  >
                    LP{period}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Course List */}
            <ScrollArea className="h-48 rounded-md border">
              <div className="p-2 space-y-1">
                {filteredCourses.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Inga kurser hittades
                  </p>
                ) : (
                  filteredCourses.map((course) => (
                    <div
                      key={course.id}
                      className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50 group cursor-pointer"
                      onClick={() => handleAddProgramCourse(course)}
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
                          {course.periods && course.periods.length > 0 && (
                            <span className="text-xs text-muted-foreground">
                              LP{course.periods.join(',')}
                            </span>
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
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAddProgramCourse(course);
                          }}
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
                <Label htmlFor="customCode">Kurskod (valfritt)</Label>
                <Input
                  id="customCode"
                  placeholder="T.ex. EDAA01"
                  value={customCourseCode}
                  onChange={(e) => setCustomCourseCode(e.target.value)}
                />
              </div>

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
                <Label>Högskolepoäng (hp)</Label>
                <Select value={customCourseHpType} onValueChange={setCustomCourseHpType}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Välj hp" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border border-border shadow-lg z-50">
                    <SelectItem value="7.5">7,5 hp</SelectItem>
                    <SelectItem value="15">15 hp</SelectItem>
                    <SelectItem value="custom">Eget värde</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {customCourseHpType === 'custom' && (
                <div className="space-y-2">
                  <Label htmlFor="customHpValue">Ange hp</Label>
                  <Input
                    id="customHpValue"
                    type="number"
                    step="0.5"
                    min="0.5"
                    placeholder="T.ex. 4.5"
                    value={customCourseHP}
                    onChange={(e) => setCustomCourseHP(e.target.value)}
                  />
                </div>
              )}

              <Button
                onClick={handleAddCustomCourse}
                disabled={!customCourseName.trim()}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Lägg till egen kurs
              </Button>

              <div className="p-3 bg-secondary/30 rounded-md">
                <div className="flex items-start gap-2">
                  <GraduationCap className="w-4 h-4 text-primary mt-0.5" />
                  <p className="text-xs text-muted-foreground">
                    Egna kurser kan användas för kurser från andra program, 
                    utbytesstudier eller specialkurser som inte finns i listan.
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
