import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, FileText, Eye, BarChart3, Calendar, User, GraduationCap, Edit2, Save, X, Plus, Trash2 } from 'lucide-react';
import { StudentInfo, TermPlan, PlannedCourse, calculatePeriodHP, calculateTermHP, HP_PER_TERM, getHPStatus, getCounselorById, StudyPace } from '@/types/planning';
import { HPProgressBar } from './HPProgressBar';
import { exportToWord, exportToText } from '@/utils/export';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface OverviewTabProps {
  studentInfo: StudentInfo;
  agenda: string;
  terms: TermPlan[];
  notes: string;
  onAgendaChange: (agenda: string) => void;
  onNotesChange: (notes: string) => void;
  onTermsChange: (terms: TermPlan[]) => void;
  onStudentInfoChange: (updates: Partial<StudentInfo>) => void;
}

export const OverviewTab = ({
  studentInfo,
  agenda,
  terms,
  notes,
  onAgendaChange,
  onNotesChange,
  onTermsChange,
  onStudentInfoChange,
}: OverviewTabProps) => {
  const [isEditingAgenda, setIsEditingAgenda] = useState(false);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [editingTermId, setEditingTermId] = useState<string | null>(null);
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [addingCourseToTerm, setAddingCourseToTerm] = useState<{termId: string, period: 'lp1' | 'lp2'} | null>(null);
  
  // New course form state
  const [newCourseCode, setNewCourseCode] = useState('');
  const [newCourseName, setNewCourseName] = useState('');
  const [newCourseHp, setNewCourseHp] = useState('7.5');
  const [newCourseStudyPace, setNewCourseStudyPace] = useState<StudyPace>(100);

  const currentDate = studentInfo.customDate 
    ? new Date(studentInfo.customDate).toLocaleDateString('sv-SE')
    : new Date().toLocaleDateString('sv-SE');
  const totalHP = terms.reduce((sum, term) => sum + calculateTermHP(term), 0);
  const totalTerms = terms.length;
  const counselor = getCounselorById(studentInfo.counselorId);

  const handleExportWord = async () => {
    await exportToWord({ studentInfo, agenda, terms, notes });
  };

  const handleExportText = () => {
    exportToText({ studentInfo, agenda, terms, notes });
  };

  const updateTerm = (termId: string, updates: Partial<TermPlan>) => {
    const newTerms = terms.map(t => t.id === termId ? { ...t, ...updates } : t);
    onTermsChange(newTerms);
  };

  const removeCourseFromTerm = (termId: string, period: 'lp1' | 'lp2', courseId: string) => {
    const newTerms = terms.map(t => {
      if (t.id !== termId) return t;
      return {
        ...t,
        [period]: t[period].filter((c: PlannedCourse) => c.id !== courseId),
      };
    });
    onTermsChange(newTerms);
  };

  const updateCourseInTerm = (termId: string, period: 'lp1' | 'lp2', courseId: string, updates: Partial<PlannedCourse>) => {
    const newTerms = terms.map(t => {
      if (t.id !== termId) return t;
      return {
        ...t,
        [period]: t[period].map((c: PlannedCourse) => 
          c.id === courseId ? { ...c, ...updates } : c
        ),
      };
    });
    onTermsChange(newTerms);
  };

  const addCourseToTerm = (termId: string, period: 'lp1' | 'lp2') => {
    if (!newCourseName.trim()) return;
    
    const newCourse: PlannedCourse = {
      id: Math.random().toString(36).substring(2, 9),
      courseId: `custom-${Date.now()}`,
      code: newCourseCode.trim() || 'EGEN',
      name: newCourseName.trim(),
      hp: parseFloat(newCourseHp) || 7.5,
      isCustom: true,
      studyPace: newCourseStudyPace,
    };
    
    const newTerms = terms.map(t => {
      if (t.id !== termId) return t;
      return {
        ...t,
        [period]: [...t[period], newCourse],
      };
    });
    onTermsChange(newTerms);
    
    // Reset form
    setNewCourseCode('');
    setNewCourseName('');
    setNewCourseHp('7.5');
    setNewCourseStudyPace(100);
    setAddingCourseToTerm(null);
  };

  const generateId = () => Math.random().toString(36).substring(2, 9);

  const createEmptyTerm = (semester: 'HT' | 'VT', year: string): TermPlan => ({
    id: generateId(),
    semester,
    year,
    customYearLabel: '',
    customSemesterLabel: '',
    lp1: [],
    lp2: [],
    retakeExamNotes: '',
  });

  const addTerm = () => {
    const lastTerm = terms[terms.length - 1];
    const nextSemester = lastTerm ? (lastTerm.semester === 'HT' ? 'VT' : 'HT') : 'HT';
    const nextYear = lastTerm 
      ? (lastTerm.semester === 'VT' ? (parseInt(lastTerm.year) + 1).toString() : lastTerm.year)
      : new Date().getFullYear().toString();
    onTermsChange([...terms, createEmptyTerm(nextSemester, nextYear)]);
  };

  const removeTerm = (termId: string) => {
    if (terms.length <= 1) return; // Keep at least one term
    onTermsChange(terms.filter(t => t.id !== termId));
  };

  const renderCourseRow = (course: PlannedCourse, termId: string, period: 'lp1' | 'lp2') => {
    const isEditing = editingCourseId === course.id;
    const isNonStandardPace = course.studyPace && course.studyPace !== 100;

    return (
      <div key={course.id} className={cn(
        "flex items-center justify-between text-sm group py-1 border-b border-border/50 last:border-0",
        isNonStandardPace && "bg-warning/10"
      )}>
        {isEditing ? (
          <div className="flex-1 flex flex-wrap gap-2 items-center">
            <Input
              value={course.code}
              onChange={(e) => updateCourseInTerm(termId, period, course.id, { code: e.target.value })}
              className="w-20 h-7 text-xs"
              placeholder="Kod"
            />
            <Input
              value={course.name}
              onChange={(e) => updateCourseInTerm(termId, period, course.id, { name: e.target.value })}
              className="flex-1 min-w-32 h-7 text-sm"
              placeholder="Kursnamn"
            />
            <Input
              type="number"
              value={course.hp}
              onChange={(e) => updateCourseInTerm(termId, period, course.id, { hp: parseFloat(e.target.value) || 0 })}
              className="w-16 h-7 text-xs"
              placeholder="HP"
              step="0.5"
            />
            <Select 
              value={(course.studyPace || 100).toString()} 
              onValueChange={(v) => updateCourseInTerm(termId, period, course.id, { studyPace: parseInt(v) as StudyPace })}
            >
              <SelectTrigger className="w-20 h-7 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="100">100%</SelectItem>
                <SelectItem value="75">75%</SelectItem>
                <SelectItem value="50">50%</SelectItem>
                <SelectItem value="25">25%</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              onClick={() => setEditingCourseId(null)}
            >
              <Save className="w-3 h-3" />
            </Button>
          </div>
        ) : (
          <>
            <span className="flex-1">
              <span className="font-mono text-muted-foreground">{course.code}</span>
              {' '}
              <span className={cn(isNonStandardPace && "font-bold text-foreground")}>
                {course.isMultiPeriod && <span className="font-bold">*</span>}
                {course.name}
              </span>
              {' '}({isNonStandardPace 
                ? `${(course.hp * (course.studyPace || 100) / 100).toFixed(2).replace(/\.?0+$/, '')} hp` 
                : `${course.hp} hp`})
              {course.isCustom && <Badge variant="outline" className="ml-1 text-xs">Egen</Badge>}
              {course.isMultiPeriod && <Badge variant="outline" className="ml-1 text-xs bg-warning/20">*Flerperiod</Badge>}
              {isNonStandardPace && <Badge variant="secondary" className="ml-1 text-xs">{course.studyPace}%</Badge>}
              {course.completedHP && course.completedHP > 0 && (
                <Badge variant="outline" className="ml-1 text-xs bg-orange-100 text-orange-800 border-orange-400">
                  *Restkurs ({course.completedHP} hp avkl.)
                </Badge>
              )}
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100"
                onClick={() => setEditingCourseId(course.id)}
              >
                <Edit2 className="w-3 h-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 text-destructive"
                onClick={() => removeCourseFromTerm(termId, period, course.id)}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          </>
        )}
      </div>
    );
  };

  const renderAddCourseForm = (termId: string, period: 'lp1' | 'lp2') => {
    if (addingCourseToTerm?.termId !== termId || addingCourseToTerm?.period !== period) {
      return (
        <Button
          variant="ghost"
          size="sm"
          className="w-full h-7 text-xs text-muted-foreground"
          onClick={() => setAddingCourseToTerm({ termId, period })}
        >
          <Plus className="w-3 h-3 mr-1" />
          Lägg till kurs
        </Button>
      );
    }

    return (
      <div className="flex flex-wrap gap-2 items-center p-2 bg-secondary/30 rounded mt-2">
        <Input
          value={newCourseCode}
          onChange={(e) => setNewCourseCode(e.target.value)}
          className="w-20 h-7 text-xs"
          placeholder="Kod"
        />
        <Input
          value={newCourseName}
          onChange={(e) => setNewCourseName(e.target.value)}
          className="flex-1 min-w-32 h-7 text-sm"
          placeholder="Kursnamn"
        />
        <Input
          type="number"
          value={newCourseHp}
          onChange={(e) => setNewCourseHp(e.target.value)}
          className="w-16 h-7 text-xs"
          placeholder="HP"
          step="0.5"
        />
        <Select 
          value={newCourseStudyPace.toString()} 
          onValueChange={(v) => setNewCourseStudyPace(parseInt(v) as StudyPace)}
        >
          <SelectTrigger className="w-20 h-7 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="100">100%</SelectItem>
            <SelectItem value="75">75%</SelectItem>
            <SelectItem value="50">50%</SelectItem>
            <SelectItem value="25">25%</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant="default"
          size="sm"
          className="h-7"
          onClick={() => addCourseToTerm(termId, period)}
          disabled={!newCourseName.trim()}
        >
          <Plus className="w-3 h-3" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-7"
          onClick={() => setAddingCourseToTerm(null)}
        >
          <X className="w-3 h-3" />
        </Button>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Student</p>
                <p className="text-lg font-medium truncate text-foreground">
                  {studentInfo.name || '—'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <GraduationCap className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Program</p>
                <p className="text-lg font-medium text-foreground">
                  {studentInfo.yearGroup || studentInfo.program}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Antal terminer</p>
                <p className="text-2xl font-bold text-foreground">{totalTerms}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <BarChart3 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Totalt planerat</p>
                <p className="text-2xl font-bold text-foreground">{totalHP.toFixed(1).replace(/\.0$/, '')} hp</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Export Buttons */}
      <div className="flex flex-wrap gap-3 justify-end">
        <Button variant="outline" onClick={handleExportText}>
          <FileText className="w-4 h-4 mr-2" />
          Ladda ner som .txt
        </Button>
        <Button onClick={handleExportWord}>
          <Download className="w-4 h-4 mr-2" />
          Ladda ner som Word
        </Button>
      </div>

      {/* Editable Preview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground font-bold">
            <Eye className="w-5 h-5 text-primary" />
            Förhandsgranskning och redigering
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Header Info */}
          <div className="border-b border-border pb-4">
            <p className="font-medium text-foreground">{counselor?.displayName || 'STVL'}</p>
            <p className="text-sm text-muted-foreground">{counselor?.email || ''}</p>
          </div>

          {/* Document Info */}
          <div className="space-y-3">
            <h3 className="text-lg font-bold text-foreground">MINNESANTECKNINGAR - STUDIEPLANERING</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Syfte:</span>
                <span className="text-foreground">Studieplanering med studievägledare</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Datum:</span>
                <Input
                  type="date"
                  value={studentInfo.customDate || new Date().toISOString().split('T')[0]}
                  onChange={(e) => onStudentInfoChange({ customDate: e.target.value })}
                  className="h-7 text-sm max-w-40"
                />
              </div>
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Student:</span>
                <Input
                  value={studentInfo.name}
                  onChange={(e) => onStudentInfoChange({ name: e.target.value })}
                  className="h-7 text-sm max-w-48"
                  placeholder="Studentens namn"
                />
              </div>
              <div className="flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Program och kull:</span>
                <span className="text-foreground">
                  {studentInfo.program === 'D' ? 'Datateknik' : studentInfo.program === 'C' ? 'Infocom' : studentInfo.program}
                  {studentInfo.yearGroup ? ` (${studentInfo.yearGroup})` : ''}
                </span>
              </div>
            </div>
          </div>

          {/* Agenda - Editable */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-foreground">Agenda</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditingAgenda(!isEditingAgenda)}
              >
                {isEditingAgenda ? <Save className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
              </Button>
            </div>
            {isEditingAgenda ? (
              <Textarea
                value={agenda}
                onChange={(e) => onAgendaChange(e.target.value)}
                rows={3}
                className="resize-none"
                placeholder="Beskriv syftet med samtalet..."
              />
            ) : (
              agenda ? (
                <p className="text-sm whitespace-pre-wrap bg-secondary/30 p-3 rounded-md text-foreground">{agenda}</p>
              ) : (
                <p className="text-sm text-muted-foreground italic">Ingen agenda angiven</p>
              )
            )}
          </div>

          {/* Study Plan - Editable */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-foreground">Studieplanering</h4>
              <div className="flex items-center gap-2">
                <Badge variant="outline">Totalt: {totalHP.toFixed(1).replace(/\.0$/, '')} hp</Badge>
                <Button variant="outline" size="sm" onClick={addTerm}>
                  <Plus className="w-3 h-3 mr-1" />
                  Lägg till termin
                </Button>
              </div>
            </div>

            {terms.map((term) => {
              const semesterLabel = term.customSemesterLabel || (term.semester === 'HT' ? 'Hösttermin' : 'Vårtermin');
              const period1Label = term.semester === 'HT' ? 'LP1' : 'LP3';
              const period2Label = term.semester === 'HT' ? 'LP2' : 'LP4';
              const termHP = calculateTermHP(term);
              const displayYear = term.customYearLabel || term.year;
              const isEditing = editingTermId === term.id;
              const status = getHPStatus(termHP, HP_PER_TERM);

              return (
                <Card key={term.id} className="bg-secondary/20">
                  <CardContent className="pt-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {isEditing ? (
                          <>
                            <Input
                              value={term.customSemesterLabel || (term.semester === 'HT' ? 'Hösttermin' : 'Vårtermin')}
                              onChange={(e) => updateTerm(term.id, { customSemesterLabel: e.target.value })}
                              className="w-28 h-7 text-sm"
                              placeholder="Termin"
                            />
                            <Input
                              value={term.customYearLabel || term.year}
                              onChange={(e) => updateTerm(term.id, { customYearLabel: e.target.value })}
                              className="w-24 h-7 text-sm"
                              placeholder="År"
                            />
                          </>
                        ) : (
                          <>
                            <h5 className="font-medium text-foreground">{semesterLabel}</h5>
                            <span className="font-medium text-foreground">{displayYear}</span>
                          </>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingTermId(isEditing ? null : term.id)}
                        >
                          {isEditing ? <Save className="w-3 h-3" /> : <Edit2 className="w-3 h-3" />}
                        </Button>
                        {terms.length > 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeTerm(term.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                      <Badge 
                        className={cn(
                          'text-xs',
                          status === 'optimal' && 'bg-success text-success-foreground',
                          status === 'warning' && 'bg-warning text-warning-foreground',
                          status === 'danger' && 'bg-destructive text-destructive-foreground'
                        )}
                      >
                        {termHP} hp
                      </Badge>
                    </div>
                    
                    <HPProgressBar current={termHP} target={HP_PER_TERM} showDetails={false} />
                    
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-20 text-foreground font-bold">Period</TableHead>
                          <TableHead className="text-foreground font-bold">Kurser</TableHead>
                          <TableHead className="w-20 text-right text-foreground font-bold">HP</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell className="font-medium text-foreground">{period1Label}</TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {term.lp1.length === 0 ? (
                                <span className="text-muted-foreground text-sm">Inga kurser</span>
                              ) : (
                                term.lp1.map((course: PlannedCourse) => renderCourseRow(course, term.id, 'lp1'))
                              )}
                              {renderAddCourseForm(term.id, 'lp1')}
                            </div>
                          </TableCell>
                          <TableCell className="text-right text-foreground">{calculatePeriodHP(term.lp1).toFixed(2).replace(/\.?0+$/, '')}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium text-foreground">{period2Label}</TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {term.lp2.length === 0 ? (
                                <span className="text-muted-foreground text-sm">Inga kurser</span>
                              ) : (
                                term.lp2.map((course: PlannedCourse) => renderCourseRow(course, term.id, 'lp2'))
                              )}
                              {renderAddCourseForm(term.id, 'lp2')}
                            </div>
                          </TableCell>
                          <TableCell className="text-right text-foreground">{calculatePeriodHP(term.lp2).toFixed(2).replace(/\.?0+$/, '')}</TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>

                    {/* Retake exam notes - editable */}
                    <div className="space-y-1">
                      <label className="text-xs text-muted-foreground">Omtentamensperiod (april/augusti)</label>
                      <Textarea
                        value={term.retakeExamNotes}
                        onChange={(e) => updateTerm(term.id, { retakeExamNotes: e.target.value })}
                        placeholder="Skriv anteckningar om omtentor här..."
                        rows={2}
                        className="resize-none text-sm"
                      />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Notes - Editable */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-foreground">Övriga anteckningar</h4>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditingNotes(!isEditingNotes)}
              >
                {isEditingNotes ? <Save className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
              </Button>
            </div>
            {isEditingNotes ? (
              <Textarea
                value={notes}
                onChange={(e) => onNotesChange(e.target.value)}
                rows={4}
                className="resize-none"
                placeholder="Anteckna övrigt som diskuteras under samtalet..."
              />
            ) : (
              notes ? (
                <p className="text-sm whitespace-pre-wrap bg-secondary/30 p-3 rounded-md text-foreground">{notes}</p>
              ) : (
                <p className="text-sm text-muted-foreground italic">Inga anteckningar</p>
              )
            )}
          </div>

          {/* Grundlogik för studieplanering */}
          <div className="border-t border-border pt-4 mt-6">
            <Card className="bg-secondary/30 border-primary/20">
              <CardContent className="pt-4">
                <h4 className="font-bold text-sm text-foreground mb-2">
                  📚 Grundlogik för studieplanering
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• 1 läsperiod = 15 hp</li>
                  <li>• 1 termin = 30 hp (LP1 + LP2 eller LP3 + LP4)</li>
                  <li>• 1 läsår = 60 hp</li>
                  <li>• 100% studietakt = 30 hp/termin</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Exam Info Preview */}
          <div className="border-t border-border pt-4 mt-6">
            <h4 className="font-bold text-sm mb-2 text-foreground">Utbildningens upplägg och examenskrav</h4>
            <div className="text-xs text-muted-foreground space-y-1 bg-secondary/30 p-3 rounded-md">
              <p>Din civilingenjörsexamen på 300 hp ska innehålla kurser enligt nedan.</p>
              <ul className="list-disc list-inside space-y-0.5 mt-2">
                <li>Obligatoriska kurser – ca 180 hp (Åk 1–3)</li>
                <li>Kurser i specialisering – minst 45 hp, varav minst 30 hp på A-nivå (Åk 4–5)</li>
                <li>Valfria kurser – ca 45 hp, varav max 15 hp externt valfria (Åk 4–5)</li>
                <li>Examensarbete – 30 hp på A-nivå (Åk 5)</li>
              </ul>
            </div>
          </div>

          {/* Centered Download Button after exam requirements */}
          <div className="flex justify-center pt-4">
            <Button onClick={handleExportWord} size="lg" className="px-8">
              <Download className="w-5 h-5 mr-2" />
              Ladda ner minnesanteckningar som Word
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
