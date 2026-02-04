import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SimpleStudentInfo } from '../SimplePlanningTab';

interface SimplePersonalInfoStepProps {
  studentInfo: SimpleStudentInfo;
  onUpdate: (info: SimpleStudentInfo) => void;
}

export const SimplePersonalInfoStep = ({ studentInfo, onUpdate }: SimplePersonalInfoStepProps) => {
  const handleChange = (field: keyof SimpleStudentInfo, value: string) => {
    onUpdate({ ...studentInfo, [field]: value });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-bold text-foreground">
          Berätta lite om dig
        </CardTitle>
        <CardDescription>
          Vi börjar med dina grunduppgifter. Det här går snabbt!
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="efternamn" className="font-medium text-foreground">
            Efternamn
          </Label>
          <Input
            id="efternamn"
            placeholder="Ex: Andersson"
            value={studentInfo.efternamn}
            onChange={(e) => handleChange('efternamn', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="fornamn" className="font-medium text-foreground">
            Förnamn
          </Label>
          <Input
            id="fornamn"
            placeholder="Ex: Anna"
            value={studentInfo.fornamn}
            onChange={(e) => handleChange('fornamn', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="program" className="font-medium text-foreground">
            Program
          </Label>
          <Input
            id="program"
            placeholder="Ex: Civilingenjör i Datateknik"
            value={studentInfo.program}
            onChange={(e) => handleChange('program', e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="antagningsar" className="font-medium text-foreground">
            Antagningsår/kull
          </Label>
          <Input
            id="antagningsar"
            placeholder="Ex: D20 eller 2020"
            value={studentInfo.antagningsar}
            onChange={(e) => handleChange('antagningsar', e.target.value)}
          />
        </div>

        <div className="mt-6 p-4 bg-muted/50 rounded-lg">
          <p className="text-sm text-muted-foreground">
            💡 <strong>Tips:</strong> Dina uppgifter sparas automatiskt medan du fyller i dem.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
