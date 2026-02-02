import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, FileText, Eye, BarChart3, Calendar } from 'lucide-react';
import { StudentInfo, TermPlan, calculatePeriodHP, calculateTermHP, HP_PER_TERM, getHPStatus } from '@/types/planning';
import { HPProgressBar } from './HPProgressBar';
import { cn } from '@/lib/utils';

interface OverviewTabProps {
  studentInfo: StudentInfo;
  agenda: string;
  terms: TermPlan[];
  notes: string;
  onExportWord: () => void;
  onExportText: () => void;
}

export const OverviewTab = ({
  studentInfo,
  agenda,
  terms,
  notes,
  onExportWord,
  onExportText,
}: OverviewTabProps) => {
  const currentDate = new Date().toLocaleDateString('sv-SE');
  const totalHP = terms.reduce((sum, term) => sum + calculateTermHP(term), 0);
  const totalTerms = terms.length;

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
                <FileText className="w-5 h-5 text-primary" />
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
                <Eye className="w-5 h-5 text-primary" />
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

      {/* Visual Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Studieplanering - Översikt
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-32">Termin</TableHead>
                  <TableHead>Läsperiod 1</TableHead>
                  <TableHead>Läsperiod 2</TableHead>
                  <TableHead className="w-24 text-right">HP/term</TableHead>
                  <TableHead className="w-32">Omtenta</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {terms.map((term) => {
                  const termHP = calculateTermHP(term);
                  const lp1HP = calculatePeriodHP(term.lp1);
                  const lp2HP = calculatePeriodHP(term.lp2);
                  const status = getHPStatus(termHP, HP_PER_TERM);
                  const period1Label = term.semester === 'HT' ? 'LP1' : 'LP3';
                  const period2Label = term.semester === 'HT' ? 'LP2' : 'LP4';

                  return (
                    <TableRow key={term.id}>
                      <TableCell className="font-medium">
                        {term.semester === 'HT' ? 'HT' : 'VT'} {term.year}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{period1Label}</span>
                            <Badge variant="outline" className="text-xs">
                              {lp1HP} hp
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {term.lp1.length === 0 ? (
                              <span className="italic">Inga kurser</span>
                            ) : (
                              term.lp1.map(c => c.name).join(', ')
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{period2Label}</span>
                            <Badge variant="outline" className="text-xs">
                              {lp2HP} hp
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {term.lp2.length === 0 ? (
                              <span className="italic">Inga kurser</span>
                            ) : (
                              term.lp2.map(c => c.name).join(', ')
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
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
                      </TableCell>
                      <TableCell>
                        {term.retakeExam ? (
                          <Badge variant="secondary" className="text-xs capitalize">
                            {term.retakeExam}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Preview of Notes */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-primary" />
            Förhandsgranskning av minnesanteckningar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-secondary/30 rounded-lg p-4 space-y-4 text-sm">
            {/* Header */}
            <div className="border-b border-border pb-3">
              <p className="font-medium">STVL Joakim Cao</p>
              <p className="text-muted-foreground">joakim.cao@lth.lu.se</p>
            </div>

            {/* Content */}
            <div className="space-y-3">
              <div>
                <span className="font-medium">Syfte: </span>
                <span>Studieplanering med studievägledare</span>
              </div>
              <div>
                <span className="font-medium">Datum: </span>
                <span>{currentDate}</span>
              </div>
              <div>
                <span className="font-medium">Student: </span>
                <span>{studentInfo.name || '—'}</span>
              </div>
              <div>
                <span className="font-medium">Program och kull: </span>
                <span>
                  {studentInfo.program === 'D' ? 'Datateknik' : 'Infocom'} 
                  {studentInfo.yearGroup && ` (${studentInfo.yearGroup})`}
                </span>
              </div>
              
              {agenda && (
                <div>
                  <span className="font-medium">Agenda: </span>
                  <p className="text-muted-foreground mt-1 whitespace-pre-wrap">{agenda}</p>
                </div>
              )}

              {notes && (
                <div>
                  <span className="font-medium">Övriga anteckningar: </span>
                  <p className="text-muted-foreground mt-1 whitespace-pre-wrap">{notes}</p>
                </div>
              )}
            </div>

            {/* Footer preview */}
            <div className="border-t border-border pt-3 text-xs text-muted-foreground">
              <p>Studie- och karriärvägledningen LTH</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Export Buttons */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="w-5 h-5 text-primary" />
            Exportera minnesanteckningar
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={onExportWord} className="flex-1">
              <Download className="w-4 h-4 mr-2" />
              Ladda ner som Word (.docx)
            </Button>
            <Button onClick={onExportText} variant="outline" className="flex-1">
              <FileText className="w-4 h-4 mr-2" />
              Ladda ner som textfil (.txt)
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
