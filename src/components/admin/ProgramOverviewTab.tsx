import { useCourses } from '@/hooks/useCourses';
import { usePrograms } from '@/hooks/usePrograms';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useState } from 'react';

export const ProgramOverviewTab = () => {
  const { programs } = usePrograms();
  const [selectedProgram, setSelectedProgram] = useState<string>('D');
  const { courses, loading } = useCourses(selectedProgram);

  // Group courses by year
  const coursesByYear: Record<number, typeof courses> = {};
  courses.forEach(c => {
    if (!coursesByYear[c.year]) coursesByYear[c.year] = [];
    coursesByYear[c.year].push(c);
  });

  const years = Object.keys(coursesByYear).map(Number).sort();

  const totalHP = courses.reduce((sum, c) => sum + c.hp, 0);
  const oblHP = courses.filter(c => c.isObligatory).reduce((sum, c) => sum + c.hp, 0);
  const altOblHP = courses.filter(c => !c.isObligatory).reduce((sum, c) => sum + c.hp, 0);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <CardTitle className="text-lg">Programöversikt</CardTitle>
          <Select value={selectedProgram} onValueChange={setSelectedProgram}>
            <SelectTrigger className="w-56 bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover border border-border shadow-lg z-50">
              {programs.map(p => (
                <SelectItem key={p.code} value={p.code}>
                  {p.name} ({p.code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mt-2">
          <span>Totalt: <strong className="text-foreground">{courses.length}</strong> kurser</span>
          <span>Totalt: <strong className="text-foreground">{totalHP} hp</strong></span>
          <span>Obl: <strong className="text-foreground">{oblHP} hp</strong></span>
          <span>Alt.obl: <strong className="text-foreground">{altOblHP} hp</strong></span>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <p className="text-muted-foreground text-center py-8">Laddar...</p>
        ) : (
          <ScrollArea className="h-[600px]">
            <div className="space-y-6">
              {years.map(year => {
                const yearCourses = coursesByYear[year];
                const yearHP = yearCourses.reduce((sum, c) => sum + c.hp, 0);
                const yearOblHP = yearCourses.filter(c => c.isObligatory).reduce((sum, c) => sum + c.hp, 0);
                const yearAltOblHP = yearCourses.filter(c => !c.isObligatory).reduce((sum, c) => sum + c.hp, 0);
                return (
                  <div key={year}>
                    <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                      <h3 className="font-semibold text-foreground">Årskurs {year}</h3>
                      <div className="flex gap-2 flex-wrap">
                        <Badge variant="secondary" className="text-xs">
                          Summa: {yearHP} hp
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          Obl: {yearOblHP} hp
                        </Badge>
                        {yearAltOblHP > 0 && (
                          <Badge variant="outline" className="text-xs border-amber-500 text-amber-600">
                            Alt.obl: {yearAltOblHP} hp
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-24">Kod</TableHead>
                          <TableHead>Namn</TableHead>
                          <TableHead className="w-16">HP</TableHead>
                          <TableHead className="w-16">Nivå</TableHead>
                          <TableHead className="w-24">LP</TableHead>
                          <TableHead className="w-20">Typ</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {yearCourses.sort((a, b) => a.code.localeCompare(b.code)).map(course => (
                          <TableRow key={course.id}>
                            <TableCell className="font-mono text-xs">{course.code}</TableCell>
                            <TableCell className="text-sm">
                              {course.isMultiPeriod && <span className="font-bold text-warning">* </span>}
                              {course.name}
                            </TableCell>
                            <TableCell className="font-medium">{course.hp}</TableCell>
                            <TableCell className="text-xs">{course.level}</TableCell>
                            <TableCell className="text-xs">
                              {course.periods?.map(p => `LP${p}`).join(', ')}
                            </TableCell>
                            <TableCell>
                              <Badge variant={course.isObligatory ? 'secondary' : 'outline'} className="text-xs">
                                {course.isObligatory ? 'Obl.' : 'Alt.obl'}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                );
              })}
              {years.length === 0 && (
                <p className="text-muted-foreground text-center py-8">Inga kurser för detta program.</p>
              )}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};
