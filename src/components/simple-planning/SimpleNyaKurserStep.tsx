import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Trash2, AlertCircle, BookOpen } from 'lucide-react';
import { SimpleNyKurs } from '../SimplePlanningTab';

interface SimpleNyaKurserStepProps {
  nyaKurser: SimpleNyKurs[];
  onAdd: () => void;
  onUpdate: (id: string, updates: Partial<SimpleNyKurs>) => void;
  onRemove: (id: string) => void;
}

export const SimpleNyaKurserStep = ({ nyaKurser, onAdd, onUpdate, onRemove }: SimpleNyaKurserStepProps) => {
  const totalHP = nyaKurser.reduce((sum, k) => sum + (k.hp || 0), 0);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-bold text-foreground">
            Vilka nya kurser ska studenten läsa?
          </CardTitle>
          <CardDescription>
            Lägg till de kurser studenten planerar att läsa denna termin. Det här är kurser studenten registrerar sig på för första gången.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Summary */}
          {nyaKurser.length > 0 && (
            <div className="mb-4 p-3 bg-primary/10 rounded-lg flex items-center gap-3">
              <BookOpen className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium text-foreground">
                {nyaKurser.length} kurs{nyaKurser.length !== 1 ? 'er' : ''} tillagda – totalt {totalHP} HP
              </span>
            </div>
          )}

          {/* Add Button */}
          <Button 
            onClick={onAdd} 
            variant="outline" 
            className="w-full border-dashed border-2 h-14 text-base gap-2 hover:bg-primary/5"
          >
            <Plus className="w-5 h-5" />
            Lägg till ny kurs
          </Button>
        </CardContent>
      </Card>

      {/* Course Cards */}
      {nyaKurser.map((kurs, index) => (
        <Card key={kurs.id} className="relative">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-foreground">
                Ny kurs {index + 1}
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
                <Label className="font-medium text-foreground">Högskolepoäng (HP)</Label>
                <Input
                  type="number"
                  step="0.5"
                  placeholder="Ex: 7.5"
                  value={kurs.hp || ''}
                  onChange={(e) => onUpdate(kurs.id, { hp: parseFloat(e.target.value) || 0 })}
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
              <Label className="font-medium text-foreground">När ska kursen läsas?</Label>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id={`ny-lp1-${kurs.id}`}
                    checked={kurs.lp1}
                    onCheckedChange={(checked) => onUpdate(kurs.id, { lp1: checked === true })}
                  />
                  <Label htmlFor={`ny-lp1-${kurs.id}`} className="font-normal cursor-pointer">
                    Läsperiod 1
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id={`ny-lp2-${kurs.id}`}
                    checked={kurs.lp2}
                    onCheckedChange={(checked) => onUpdate(kurs.id, { lp2: checked === true })}
                  />
                  <Label htmlFor={`ny-lp2-${kurs.id}`} className="font-normal cursor-pointer">
                    Läsperiod 2
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id={`ny-lp3-${kurs.id}`}
                    checked={kurs.lp3}
                    onCheckedChange={(checked) => onUpdate(kurs.id, { lp3: checked === true })}
                  />
                  <Label htmlFor={`ny-lp3-${kurs.id}`} className="font-normal cursor-pointer">
                    Läsperiod 3
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id={`ny-lp4-${kurs.id}`}
                    checked={kurs.lp4}
                    onCheckedChange={(checked) => onUpdate(kurs.id, { lp4: checked === true })}
                  />
                  <Label htmlFor={`ny-lp4-${kurs.id}`} className="font-normal cursor-pointer">
                    Läsperiod 4
                  </Label>
                </div>
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

      {nyaKurser.length === 0 && (
        <Card className="bg-muted/30">
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">
              Inga nya kurser tillagda ännu. Klicka på knappen ovan för att lägga till.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
