import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { User, GraduationCap, FileText, ArrowRight, ArrowLeft, Plus, Trash2, ListChecks } from 'lucide-react';
import { StudentInfo, Program, COUNSELORS, getCounselorById, ActionItem } from '@/types/planning';
import { useState } from 'react';
import { usePrograms } from '@/hooks/usePrograms';

interface BasicInfoTabProps {
  studentInfo: StudentInfo;
  actionItems: ActionItem[];
  onStudentInfoChange: (updates: Partial<StudentInfo>) => void;
  onActionItemsChange: {
    add: () => void;
    update: (id: string, updates: Partial<ActionItem>) => void;
    remove: (id: string) => void;
  };
  onNextTab?: () => void;
  onPrevTab?: () => void;
}

// Programs are now loaded dynamically via usePrograms hook

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
  actionItems,
  onStudentInfoChange, 
  onActionItemsChange,
  onNextTab,
  onPrevTab,
}: BasicInfoTabProps) => {
  const [customProgram, setCustomProgram] = useState(
    studentInfo.program !== 'D' && studentInfo.program !== 'C' ? studentInfo.program : ''
  );
  const [useCustomProgram, setUseCustomProgram] = useState(
    studentInfo.program !== 'D' && studentInfo.program !== 'C' && studentInfo.program !== ''
  );
  const [customCounselor, setCustomCounselor] = useState('');
  const [useCustomCounselor, setUseCustomCounselor] = useState(
    !COUNSELORS.find(c => c.id === studentInfo.counselorId)
  );

  const todayISO = new Date().toISOString().split('T')[0];
  const displayDate = studentInfo.customDate || todayISO;

  const currentCounselor = getCounselorById(studentInfo.counselorId);

  return (
    <div className="space-y-6">
      {/* Back button */}
      {onPrevTab && (
        <div className="flex justify-start">
          <Button variant="outline" onClick={onPrevTab} size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Tillbaka till Studieplanering
          </Button>
        </div>
      )}

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

            {/* Program Selection - with custom option */}
            <div className="space-y-2">
              <Label htmlFor="program" className="text-foreground font-medium">Program</Label>
              {useCustomProgram ? (
                <div className="flex gap-2">
                  <Input
                    placeholder="Ange programnamn..."
                    value={customProgram}
                    onChange={(e) => {
                      setCustomProgram(e.target.value);
                      onStudentInfoChange({ program: e.target.value as Program });
                    }}
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setUseCustomProgram(false);
                      setCustomProgram('');
                      onStudentInfoChange({ program: 'D' });
                    }}
                  >
                    Välj från lista
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Select
                    value={studentInfo.program}
                    onValueChange={(value: Program) => onStudentInfoChange({ program: value })}
                  >
                    <SelectTrigger id="program" className="bg-background flex-1">
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
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setUseCustomProgram(true)}
                  >
                    Annat
                  </Button>
                </div>
              )}
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

            {/* Counselor - with custom option */}
            <div className="space-y-2">
              <Label htmlFor="counselor" className="text-foreground font-medium">Studievägledare</Label>
              {useCustomCounselor ? (
                <div className="flex gap-2">
                  <Input
                    placeholder="Ange studievägledare..."
                    value={customCounselor}
                    onChange={(e) => {
                      setCustomCounselor(e.target.value);
                      onStudentInfoChange({ counselorId: `custom:${e.target.value}` });
                    }}
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setUseCustomCounselor(false);
                      setCustomCounselor('');
                      onStudentInfoChange({ counselorId: 'joakim' });
                    }}
                  >
                    Välj från lista
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Select
                    value={studentInfo.counselorId}
                    onValueChange={(value) => onStudentInfoChange({ counselorId: value })}
                  >
                    <SelectTrigger className="bg-background flex-1">
                      <SelectValue placeholder="Välj studievägledare" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border border-border shadow-lg z-50">
                      {COUNSELORS.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setUseCustomCounselor(true)}
                  >
                    Annat
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Plan / Todo List Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground font-bold">
            <ListChecks className="w-5 h-5 text-primary" />
            Handlingsplan – Att göra
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {actionItems.length === 0 && (
              <p className="text-sm text-muted-foreground italic">
                Inga uppgifter tillagda ännu. Klicka på knappen nedan för att lägga till.
              </p>
            )}
            {actionItems.map((item) => (
              <div key={item.id} className="flex items-start gap-3 p-3 border border-border rounded-lg bg-secondary/20">
                <Checkbox
                  checked={item.done}
                  onCheckedChange={(checked) => 
                    onActionItemsChange.update(item.id, { done: checked === true })
                  }
                  className="mt-1"
                />
                <div className="flex-1 space-y-2">
                  <Input
                    placeholder="Aktivitet..."
                    value={item.activity}
                    onChange={(e) => onActionItemsChange.update(item.id, { activity: e.target.value })}
                    className={item.done ? 'line-through text-muted-foreground' : ''}
                  />
                  <Input
                    placeholder="Kommentar..."
                    value={item.comment}
                    onChange={(e) => onActionItemsChange.update(item.id, { comment: e.target.value })}
                    className="text-sm"
                  />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive h-8 w-8 p-0"
                  onClick={() => onActionItemsChange.remove(item.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={onActionItemsChange.add}
              className="w-full"
            >
              <Plus className="w-4 h-4 mr-2" />
              Lägg till uppgift
            </Button>
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

      {/* Navigation Buttons */}
      <div className="flex justify-between pt-4">
        <div>
          {onPrevTab && (
            <Button variant="outline" onClick={onPrevTab}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Studieplanering
            </Button>
          )}
        </div>
        {onNextTab && (
          <Button onClick={onNextTab} size="lg">
            Fortsätt till Överblick & Export
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
};
