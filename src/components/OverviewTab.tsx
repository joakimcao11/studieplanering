import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, FileText, Eye, BarChart3, Calendar, User, GraduationCap, Edit2, Save, X } from 'lucide-react';
import { StudentInfo, TermPlan, PlannedCourse, calculatePeriodHP, calculateTermHP, HP_PER_TERM, getHPStatus, getCounselorById } from '@/types/planning';
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

  const currentDate = new Date().toLocaleDateString('sv-SE');
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

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <BarChart3 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Totalt planerat</p>
                <p className="text-2xl font-bold">{totalHP} hp</p>
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
                <p className="text-2xl font-bold">{totalTerms}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <User className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Student</p>
                <p className="text-lg font-medium truncate">
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
                <p className="text-lg font-medium">
                  {studentInfo.yearGroup || studentInfo.program}
                </p>
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
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-primary" />
            Förhandsgranskning och redigering
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Header Info */}
          <div className="border-b border-border pb-4">
            <p className="font-medium">{counselor?.displayName || 'STVL'}</p>
            <p className="text-sm text-muted-foreground">{counselor?.email || ''}</p>
          </div>

          {/* Document Info */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">MINNESANTECKNINGAR - STUDIEPLANERING</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Syfte:</span>
                <span>Studieplanering med studievägledare</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">Datum:</span>
                <span>{currentDate}</span>
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
                <span>{studentInfo.program === 'D' ? 'Datateknik' : 'Infocom'}{studentInfo.yearGroup ? ` (${studentInfo.yearGroup})` : ''}</span>
              </div>
            </div>
          </div>

          {/* Agenda - Editable */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Agenda</h4>
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
                <p className="text-sm whitespace-pre-wrap bg-secondary/30 p-3 rounded-md">{agenda}</p>
              ) : (
                <p className="text-sm text-muted-foreground italic">Ingen agenda angiven</p>
              )
            )}
          </div>

          {/* Study Plan - Editable */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-medium">Studieplanering</h4>
              <Badge variant="outline">Totalt: {totalHP} hp</Badge>
            </div>

            {terms.map((term) => {
              const semesterLabel = term.semester === 'HT' ? 'Hösttermin' : 'Vårtermin';
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
                        <h5 className="font-medium">{semesterLabel}</h5>
                        {isEditing ? (
                          <Input
                            value={term.customYearLabel || term.year}
                            onChange={(e) => updateTerm(term.id, { customYearLabel: e.target.value })}
                            className="w-24 h-7 text-sm"
                          />
                        ) : (
                          <span className="font-medium">{displayYear}</span>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingTermId(isEditing ? null : term.id)}
                        >
                          {isEditing ? <Save className="w-3 h-3" /> : <Edit2 className="w-3 h-3" />}
                        </Button>
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
                          <TableHead className="w-20">Period</TableHead>
                          <TableHead>Kurser</TableHead>
                          <TableHead className="w-20 text-right">HP</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        <TableRow>
                          <TableCell className="font-medium">{period1Label}</TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {term.lp1.length === 0 ? (
                                <span className="text-muted-foreground text-sm">Inga kurser</span>
                              ) : (
                                term.lp1.map((course: PlannedCourse) => (
                                  <div key={course.id} className="flex items-center justify-between text-sm group">
                                    <span>
                                      <span className="font-mono text-muted-foreground">{course.code}</span>
                                      {' '}{course.name} ({course.hp} hp)
                                      {course.isCustom && <Badge variant="outline" className="ml-1 text-xs">Egen</Badge>}
                                    </span>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 text-destructive"
                                      onClick={() => removeCourseFromTerm(term.id, 'lp1', course.id)}
                                    >
                                      <X className="w-3 h-3" />
                                    </Button>
                                  </div>
                                ))
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">{calculatePeriodHP(term.lp1)}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell className="font-medium">{period2Label}</TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              {term.lp2.length === 0 ? (
                                <span className="text-muted-foreground text-sm">Inga kurser</span>
                              ) : (
                                term.lp2.map((course: PlannedCourse) => (
                                  <div key={course.id} className="flex items-center justify-between text-sm group">
                                    <span>
                                      <span className="font-mono text-muted-foreground">{course.code}</span>
                                      {' '}{course.name} ({course.hp} hp)
                                      {course.isCustom && <Badge variant="outline" className="ml-1 text-xs">Egen</Badge>}
                                    </span>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 text-destructive"
                                      onClick={() => removeCourseFromTerm(term.id, 'lp2', course.id)}
                                    >
                                      <X className="w-3 h-3" />
                                    </Button>
                                  </div>
                                ))
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">{calculatePeriodHP(term.lp2)}</TableCell>
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
              <h4 className="font-medium">Övriga anteckningar</h4>
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
                <p className="text-sm whitespace-pre-wrap bg-secondary/30 p-3 rounded-md">{notes}</p>
              ) : (
                <p className="text-sm text-muted-foreground italic">Inga anteckningar</p>
              )
            )}
          </div>

          {/* Exam Info Preview */}
          <div className="border-t border-border pt-4 mt-6">
            <h4 className="font-medium text-sm mb-2">Utbildningens upplägg och examenskrav</h4>
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
        </CardContent>
      </Card>
    </div>
  );
};
