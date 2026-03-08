import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Plus, BookOpen, PenLine, GraduationCap, ExternalLink } from 'lucide-react';
import { Course } from '@/data/courses';
import { Program, PlannedCourse, StudyPace } from '@/types/planning';
import { useCourses } from '@/hooks/useCourses';
import { usePrograms } from '@/hooks/usePrograms';

interface CourseSelectorProps {
  program: Program;
  onAddCourse: (course: PlannedCourse) => void;
  onCourseClick?: (course: PlannedCourse) => void;
}

type FilterType = 'all' | 'obligatory' | 'alt_obligatory';
type PeriodFilter = 'all' | '1' | '2' | '3' | '4';
type YearFilter = 'all' | 1 | 2 | 3;

export const CourseSelector = ({ program, onAddCourse, onCourseClick }: CourseSelectorProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('all');
  const [yearFilter, setYearFilter] = useState<YearFilter>('all');
  const [customCourseName, setCustomCourseName] = useState('');
  const [customCourseCode, setCustomCourseCode] = useState('');
  const [customCourseHpType, setCustomCourseHpType] = useState<string>('7.5');
  const [customCourseHP, setCustomCourseHP] = useState<string>('');
  const [customStudyPace, setCustomStudyPace] = useState<StudyPace>(100);

  const { courses, loading: coursesLoading } = useCourses(program);
  const { programs: allPrograms } = usePrograms();
  
  const filteredCourses = courses.filter((course) => {
    const matchesSearch = 
      course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.code.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesFilter = filterType === 'all' 
      || (filterType === 'obligatory' && course.isObligatory)
      || (filterType === 'alt_obligatory' && !course.isObligatory);
    
    const matchesPeriod = periodFilter === 'all' || 
      (course.periods && course.periods.includes(periodFilter));
    
    const matchesYear = yearFilter === 'all' || course.year === yearFilter;
    
    return matchesSearch && matchesFilter && matchesPeriod && matchesYear;
  });

  const handleAddProgramCourse = (course: Course) => {
    const studyPace = course.isMultiPeriod ? (course.defaultStudyPace as StudyPace || 50) : 100;
    const planned: PlannedCourse = {
      id: '',
      courseId: course.id,
      code: course.code,
      name: course.name,
      hp: course.hp,
      isCustom: false,
      studyPace,
      isMultiPeriod: course.isMultiPeriod,
    };
    if (onCourseClick) {
      onCourseClick(planned);
    } else {
      onAddCourse(planned);
    }
  };

  const handleAddCustomCourse = () => {
    if (!customCourseName.trim()) return;
    
    const hp = customCourseHpType === 'custom' 
      ? parseFloat(customCourseHP) || 7.5
      : parseFloat(customCourseHpType);
    
    const planned: PlannedCourse = {
      id: '',
      courseId: `custom-${Date.now()}`,
      code: customCourseCode.trim() || 'EGEN',
      name: customCourseName.trim(),
      hp: hp,
      isCustom: true,
      studyPace: customStudyPace,
    };
    
    if (onCourseClick) {
      onCourseClick(planned);
    } else {
      onAddCourse(planned);
    }
    
    setCustomCourseName('');
    setCustomCourseCode('');
    setCustomCourseHpType('7.5');
    setCustomCourseHP('');
    setCustomStudyPace(100);
  };

  const currentProgram = allPrograms.find(p => p.code === program);
  const programLink = currentProgram?.link_url || '';
  const programLinkLabel = currentProgram ? `Program läsår ${currentProgram.code}` : `Program läsår ${program}`;

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-primary" />
          Lägg till kurs
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Program Link Button */}
        {programLink && (
          <Button 
            variant="outline" 
            className="w-full justify-between text-foreground"
            onClick={() => window.open(programLink, '_blank')}
          >
            <span className="font-medium">{programLinkLabel}</span>
            <ExternalLink className="w-4 h-4" />
          </Button>
        )}

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

            {/* Year Filter */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Årskurs</Label>
              <div className="flex flex-wrap gap-2">
                <Badge 
                  variant={yearFilter === 'all' ? 'default' : 'outline'}
                  className="cursor-pointer"
                  onClick={() => setYearFilter('all')}
                >
                  Alla
                </Badge>
                {[1, 2, 3].map((year) => (
                  <Badge 
                    key={year}
                    variant={yearFilter === year ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => setYearFilter(year as YearFilter)}
                  >
                    Åk {year}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Filter Type */}
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Kurstyp</Label>
              <div className="flex flex-wrap gap-2">
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
                <Button
                  variant={filterType === 'alt_obligatory' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterType('alt_obligatory')}
                >
                  Alt.obl
                </Button>
              </div>
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
                      className="p-2 rounded-md hover:bg-muted/50 cursor-pointer"
                      onClick={() => handleAddProgramCourse(course)}
                    >
                      <div className="flex items-start gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-xs text-muted-foreground font-mono">
                              {course.code}
                            </span>
                            {course.isObligatory ? (
                              <Badge variant="secondary" className="text-xs">
                                Obl.
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-xs border-amber-500 text-amber-600">
                                Alt.obl
                              </Badge>
                            )}
                            {course.periods && course.periods.length > 0 && (
                              <span className="text-xs text-muted-foreground">
                                LP{course.periods.join(',')}
                              </span>
                            )}
                            {course.isMultiPeriod && (
                              <Badge variant="outline" className="text-xs bg-warning/20 text-warning-foreground border-warning">
                                *Flerperiod
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-foreground break-words leading-snug pr-2">
                            {course.isMultiPeriod && <span className="font-bold">*</span>}
                            {course.name}
                          </p>
                        </div>
                        <span className="text-xs font-semibold text-primary shrink-0 whitespace-nowrap self-start">
                          {course.hp} hp
                        </span>
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
                <Label htmlFor="customCode" className="text-foreground">Kurskod (valfritt)</Label>
                <Input
                  id="customCode"
                  placeholder="T.ex. EDAA01"
                  value={customCourseCode}
                  onChange={(e) => setCustomCourseCode(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="customName" className="text-foreground">Kursnamn</Label>
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
                <Label className="text-foreground">Högskolepoäng (hp)</Label>
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
                  <Label htmlFor="customHpValue" className="text-foreground">Ange hp</Label>
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

              {/* Study Pace Selector */}
              <div className="space-y-2">
                <Label className="text-foreground">Studietakt</Label>
                <Select 
                  value={customStudyPace.toString()} 
                  onValueChange={(v) => setCustomStudyPace(parseInt(v) as StudyPace)}
                >
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="Välj studietakt" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border border-border shadow-lg z-50">
                    <SelectItem value="100">100% (heltid)</SelectItem>
                    <SelectItem value="75">75%</SelectItem>
                    <SelectItem value="50">50%</SelectItem>
                    <SelectItem value="25">25%</SelectItem>
                  </SelectContent>
                </Select>
              </div>

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
                    Ange studietakt om kursen inte läses på heltid.
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
