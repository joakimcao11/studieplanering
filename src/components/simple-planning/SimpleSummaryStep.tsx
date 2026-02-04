import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { FileText, Download, Pencil, GraduationCap, BookOpen, User } from 'lucide-react';
import { SimpleStudentInfo, SimpleRestkurs, SimpleNyKurs } from '../SimplePlanningTab';

interface SimpleSummaryStepProps {
  studentInfo: SimpleStudentInfo;
  restkurser: SimpleRestkurs[];
  nyaKurser: SimpleNyKurs[];
  onEditRestkurs: (id: string) => void;
  onEditNyKurs: (id: string) => void;
}

export const SimpleSummaryStep = ({
  studentInfo,
  restkurser,
  nyaKurser,
  onEditRestkurs,
  onEditNyKurs,
}: SimpleSummaryStepProps) => {
  // Calculate HP
  const restHP = restkurser.reduce((sum, k) => sum + (k.restpoang || 0), 0);
  const nyHP = nyaKurser.reduce((sum, k) => sum + (k.hp || 0), 0);
  const totalHP = restHP + nyHP;

  // Calculate per period
  const lp3Rest = restkurser.filter(k => k.lp3).reduce((sum, k) => sum + (k.restpoang || 0), 0);
  const lp4Rest = restkurser.filter(k => k.lp4).reduce((sum, k) => sum + (k.restpoang || 0), 0);
  const lp3Nya = nyaKurser.filter(k => k.lp3).reduce((sum, k) => sum + (k.hp || 0), 0);
  const lp4Nya = nyaKurser.filter(k => k.lp4).reduce((sum, k) => sum + (k.hp || 0), 0);
  const lp3Total = lp3Rest + lp3Nya;
  const lp4Total = lp4Rest + lp4Nya;

  const handleExport = () => {
    // Create a simple text export
    let content = `STUDIEPLAN FÖR VT\n`;
    content += `${'='.repeat(40)}\n\n`;
    content += `PERSONUPPGIFTER\n`;
    content += `-`.repeat(20) + `\n`;
    content += `Namn: ${studentInfo.fornamn} ${studentInfo.efternamn}\n`;
    content += `Program: ${studentInfo.program}\n`;
    content += `Antagningsår: ${studentInfo.antagningsar}\n\n`;

    if (restkurser.length > 0) {
      content += `RESTKURSER (omregistrering)\n`;
      content += `-`.repeat(20) + `\n`;
      restkurser.forEach(k => {
        const perioder = [k.lp3 ? 'LP3' : '', k.lp4 ? 'LP4' : ''].filter(Boolean).join(', ');
        content += `${k.kurskod} - ${k.kursnamn} (${k.restpoang} HP) - ${perioder}\n`;
        if (k.tentadatum) content += `  Tenta: ${k.tentadatum}\n`;
        if (k.omtentadatum) content += `  Omtenta: ${k.omtentadatum}\n`;
      });
      content += `\n`;
    }

    if (nyaKurser.length > 0) {
      content += `NYA KURSER\n`;
      content += `-`.repeat(20) + `\n`;
      nyaKurser.forEach(k => {
        const perioder = [k.lp3 ? 'LP3' : '', k.lp4 ? 'LP4' : ''].filter(Boolean).join(', ');
        content += `${k.kurskod} - ${k.kursnamn} (${k.hp} HP) - ${perioder}\n`;
      });
      content += `\n`;
    }

    content += `SAMMANFATTNING\n`;
    content += `-`.repeat(20) + `\n`;
    content += `Totalt HP: ${totalHP}\n`;
    content += `Läsperiod 3: ${lp3Total} HP\n`;
    content += `Läsperiod 4: ${lp4Total} HP\n`;

    // Download
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `studieplan-vt-${studentInfo.efternamn || 'student'}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Header Card */}
      <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-foreground flex items-center gap-3">
            <GraduationCap className="w-7 h-7 text-primary" />
            Din studieplan för VT
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div className="bg-background/80 rounded-lg p-4 text-center">
              <p className="text-3xl font-bold text-primary">{totalHP}</p>
              <p className="text-sm text-muted-foreground">Totalt HP</p>
            </div>
            <div className="bg-background/80 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-foreground">{lp3Total}</p>
              <p className="text-sm text-muted-foreground">Läsperiod 3</p>
            </div>
            <div className="bg-background/80 rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-foreground">{lp4Total}</p>
              <p className="text-sm text-muted-foreground">Läsperiod 4</p>
            </div>
          </div>

          {/* Student Info */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <User className="w-4 h-4" />
            <span>
              {studentInfo.fornamn} {studentInfo.efternamn} • {studentInfo.program} • {studentInfo.antagningsar}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Restkurser Section */}
      {restkurser.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-amber-600" />
              Restkurser (omregistrering)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {restkurser.map((kurs) => (
              <div
                key={kurs.id}
                className="flex items-start justify-between p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg"
              >
                <div className="space-y-1">
                  <p className="font-medium text-foreground">
                    {kurs.kurskod} – {kurs.kursnamn}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {kurs.restpoang} HP • {[kurs.lp3 ? 'LP3' : '', kurs.lp4 ? 'LP4' : ''].filter(Boolean).join(' & ')}
                  </p>
                  {(kurs.tentadatum || kurs.omtentadatum) && (
                    <p className="text-xs text-muted-foreground">
                      {kurs.tentadatum && `Tenta: ${kurs.tentadatum}`}
                      {kurs.tentadatum && kurs.omtentadatum && ' • '}
                      {kurs.omtentadatum && `Omtenta: ${kurs.omtentadatum}`}
                    </p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEditRestkurs(kurs.id)}
                  className="gap-1 text-muted-foreground hover:text-foreground"
                >
                  <Pencil className="w-3 h-3" />
                  Ändra
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Nya kurser Section */}
      {nyaKurser.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold text-foreground flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              Nya kurser
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {nyaKurser.map((kurs) => (
              <div
                key={kurs.id}
                className="flex items-start justify-between p-3 bg-primary/5 border border-primary/20 rounded-lg"
              >
                <div className="space-y-1">
                  <p className="font-medium text-foreground">
                    {kurs.kurskod} – {kurs.kursnamn}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {kurs.hp} HP • {[kurs.lp3 ? 'LP3' : '', kurs.lp4 ? 'LP4' : ''].filter(Boolean).join(' & ')}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEditNyKurs(kurs.id)}
                  className="gap-1 text-muted-foreground hover:text-foreground"
                >
                  <Pencil className="w-3 h-3" />
                  Ändra
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {restkurser.length === 0 && nyaKurser.length === 0 && (
        <Card className="bg-muted/30">
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">
              Du har inte lagt till några kurser ännu. Gå tillbaka till steg 2 eller 3 för att lägga till kurser.
            </p>
          </CardContent>
        </Card>
      )}

      <Separator className="my-6" />

      {/* Export Button */}
      <div className="flex justify-center">
        <Button 
          onClick={handleExport}
          size="lg"
          className="gap-2"
        >
          <Download className="w-5 h-5" />
          Exportera som textfil
        </Button>
      </div>

      <p className="text-center text-sm text-muted-foreground">
        Vi räknar automatiskt ihop dina poäng. Du kan när som helst gå tillbaka och ändra.
      </p>
    </div>
  );
};
