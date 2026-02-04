import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Trash2, AlertCircle, Info } from 'lucide-react';
import { SimpleRestkurs } from '../SimplePlanningTab';

interface SimpleRestkurserStepProps {
  restkurser: SimpleRestkurs[];
  onAdd: () => void;
  onUpdate: (id: string, updates: Partial<SimpleRestkurs>) => void;
  onRemove: (id: string) => void;
}

export const SimpleRestkurserStep = ({ restkurser, onAdd, onUpdate, onRemove }: SimpleRestkurserStepProps) => {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-bold text-foreground">
            Har studenten några restkurser?
          </CardTitle>
          <CardDescription>
            Restkurser är kurser studenten påbörjat men inte slutfört. Lägg till dem här för att hålla koll.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Info Box */}
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg flex gap-3">
            <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800 dark:text-blue-200">
              <p>
                För att CSN ska godkänna studier med restkurser behöver studenten vara omregistrerad. 
                Kontakta kursansvarig eller utbildningsadministratör för omregistrering.
              </p>
            </div>
          </div>

          {/* Add Button */}
          <Button 
            onClick={onAdd} 
            variant="outline" 
            className="w-full border-dashed border-2 h-14 text-base gap-2 hover:bg-primary/5"
          >
            <Plus className="w-5 h-5" />
            Lägg till restkurs
          </Button>
        </CardContent>
      </Card>

      {/* Course Cards */}
      {restkurser.map((kurs, index) => (
        <Card key={kurs.id} className="relative">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-foreground">
                Restkurs {index + 1}
              </CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onRemove(kurs.id)}
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-medium text-foreground">Kurskod</Label>
                <Input
                  placeholder="Ex: EDAA01"
                  value={kurs.kurskod}
                  onChange={(e) => onUpdate(kurs.id, { kurskod: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label className="font-medium text-foreground">Restpoäng</Label>
                <Input
                  type="number"
                  step="0.5"
                  placeholder="Ex: 7.5"
                  value={kurs.restpoang || ''}
                  onChange={(e) => onUpdate(kurs.id, { restpoang: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="font-medium text-foreground">Kursnamn</Label>
              <Input
                placeholder="Ex: Programmeringsteknik"
                value={kurs.kursnamn}
                onChange={(e) => onUpdate(kurs.id, { kursnamn: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label className="font-medium text-foreground">När ges kursen?</Label>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id={`lp1-${kurs.id}`}
                    checked={kurs.lp1}
                    onCheckedChange={(checked) => onUpdate(kurs.id, { lp1: checked === true })}
                  />
                  <Label htmlFor={`lp1-${kurs.id}`} className="font-normal cursor-pointer">
                    Läsperiod 1
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id={`lp2-${kurs.id}`}
                    checked={kurs.lp2}
                    onCheckedChange={(checked) => onUpdate(kurs.id, { lp2: checked === true })}
                  />
                  <Label htmlFor={`lp2-${kurs.id}`} className="font-normal cursor-pointer">
                    Läsperiod 2
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id={`lp3-${kurs.id}`}
                    checked={kurs.lp3}
                    onCheckedChange={(checked) => onUpdate(kurs.id, { lp3: checked === true })}
                  />
                  <Label htmlFor={`lp3-${kurs.id}`} className="font-normal cursor-pointer">
                    Läsperiod 3
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id={`lp4-${kurs.id}`}
                    checked={kurs.lp4}
                    onCheckedChange={(checked) => onUpdate(kurs.id, { lp4: checked === true })}
                  />
                  <Label htmlFor={`lp4-${kurs.id}`} className="font-normal cursor-pointer">
                    Läsperiod 4
                  </Label>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="font-medium text-foreground">Tentadatum</Label>
                <Input
                  type="date"
                  value={kurs.tentadatum}
                  onChange={(e) => onUpdate(kurs.id, { tentadatum: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label className="font-medium text-foreground">Omtentadatum</Label>
                <Input
                  type="date"
                  value={kurs.omtentadatum}
                  onChange={(e) => onUpdate(kurs.id, { omtentadatum: e.target.value })}
                />
              </div>
            </div>

            {(!kurs.kurskod || !kurs.kursnamn) && (
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>Fyll i kurskod och kursnamn för att spara kursen</span>
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      {restkurser.length === 0 && (
        <Card className="bg-muted/30">
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">
              Inga restkurser tillagda ännu. Klicka på knappen ovan för att lägga till.
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Om studenten inte har några restkurser kan du gå vidare till nästa steg.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
