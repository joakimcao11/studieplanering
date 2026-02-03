import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, User, GraduationCap, FileText, ArrowRight } from 'lucide-react';
import { StudentInfo, Program, COUNSELORS, getCounselorById } from '@/types/planning';

interface BasicInfoTabProps {
  studentInfo: StudentInfo;
  agenda: string;
  onStudentInfoChange: (updates: Partial<StudentInfo>) => void;
  onAgendaChange: (agenda: string) => void;
  onNextTab?: () => void;
}

const programs = [
  { value: 'D', label: 'Civilingenjör i Datateknik (D)' },
  { value: 'C', label: 'Civilingenjör i Infocom (C)' },
];

// Generate year groups from kull 15 to kull 30
const generateYearGroups = () => {
  const groups: string[] = [];
  for (let year = 15; year <= 30; year++) {
    groups.push(`D${year}`, `C${year}`);
  }
  return groups.sort();
};

const yearGroups = generateYearGroups();

export const BasicInfoTab = ({ 
  studentInfo, 
  agenda, 
  onStudentInfoChange, 
  onAgendaChange,
  onNextTab,
}: BasicInfoTabProps) => {
  const todayFormatted = new Date().toLocaleDateString('sv-SE', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  
  const todayISO = new Date().toISOString().split('T')[0];
  const displayDate = studentInfo.customDate || todayISO;

  const currentCounselor = getCounselorById(studentInfo.counselorId);

  return (
    <div className="space-y-6">
      {/* Basic Information Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground font-bold">
            <User className="w-5 h-5 text-primary" />
            Grundinformation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Date - Editable */}
          <div className="space-y-2">
            <Label htmlFor="meetingDate" className="text-foreground font-medium">Datum</Label>
            <Input
              id="meetingDate"
              type="date"
              value={displayDate}
              onChange={(e) => onStudentInfoChange({ customDate: e.target.value })}
              className="max-w-xs"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Student Name */}
            <div className="space-y-2">
              <Label htmlFor="studentName" className="text-foreground font-medium">Studentens namn</Label>
              <Input
                id="studentName"
                placeholder="Förnamn Efternamn"
                value={studentInfo.name}
                onChange={(e) => onStudentInfoChange({ name: e.target.value })}
              />
            </div>

            {/* Program Selection */}
            <div className="space-y-2">
              <Label htmlFor="program" className="text-foreground font-medium">Program</Label>
              <Select
                value={studentInfo.program}
                onValueChange={(value: Program) => onStudentInfoChange({ program: value })}
              >
                <SelectTrigger id="program" className="bg-background">
                  <SelectValue placeholder="Välj program" />
                </SelectTrigger>
                <SelectContent className="bg-popover border border-border shadow-lg z-50">
                  {programs.map((program) => (
                    <SelectItem key={program.value} value={program.value}>
                      {program.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Year Group */}
            <div className="space-y-2">
              <Label htmlFor="yearGroup" className="text-foreground font-medium">Årskull</Label>
              <Select
                value={studentInfo.yearGroup}
                onValueChange={(value) => onStudentInfoChange({ yearGroup: value })}
              >
                <SelectTrigger id="yearGroup" className="bg-background">
                  <SelectValue placeholder="Välj årskull" />
                </SelectTrigger>
                <SelectContent className="bg-popover border border-border shadow-lg z-50">
                  {yearGroups
                    .filter((g) => g.startsWith(studentInfo.program))
                    .map((group) => (
                      <SelectItem key={group} value={group}>
                        {group}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* Counselor - Displayed from header selection */}
            <div className="space-y-2">
              <Label htmlFor="counselor" className="text-foreground font-medium">Studievägledare</Label>
              <div className="flex items-center gap-2 p-2 border border-input rounded-md bg-muted/30">
                <GraduationCap className="w-4 h-4 text-primary" />
                <span className="text-sm text-foreground">{currentCounselor?.name || 'Välj studievägledare'}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Agenda Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground font-bold">
            <FileText className="w-5 h-5 text-primary" />
            Agenda
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="agenda" className="text-foreground font-medium">Syftet med samtalet / agenda</Label>
            <Textarea
              id="agenda"
              placeholder="Beskriv syftet med samtalet och vad ni ska gå igenom..."
              value={agenda}
              onChange={(e) => onAgendaChange(e.target.value)}
              rows={5}
              className="resize-none"
            />
          </div>
        </CardContent>
      </Card>

      {/* Info box about HP */}
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

      {/* Navigation Button */}
      {onNextTab && (
        <div className="flex justify-end pt-4">
          <Button onClick={onNextTab} size="lg">
            Fortsätt till Studieplanering
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      )}
    </div>
  );
};
