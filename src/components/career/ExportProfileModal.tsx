import { useState } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Image, FileText, Presentation, FileType, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import type { CareerProfile } from '@/types/careerProfile';
import { exportDocx, exportPdf, exportPng, exportPptx, type ExportFormat, type PageOrientation } from '@/utils/careerExport';

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  profile: CareerProfile;
  captureRef: React.RefObject<HTMLDivElement>;
}

const FORMATS: { id: ExportFormat; label: string; desc: string; icon: typeof Image }[] = [
  { id: 'png', label: 'Bild (PNG)', desc: 'Din karta som bild – bra för mobil och anteckningar.', icon: Image },
  { id: 'pdf', label: 'PDF', desc: 'Karta plus alla dina ord och reflektioner, redo att skriva ut.', icon: FileText },
  { id: 'pptx', label: 'PowerPoint', desc: 'Redigerbar presentation med dina områden.', icon: Presentation },
  { id: 'docx', label: 'Word', desc: 'Dokument du kan skriva vidare i.', icon: FileType },
];

export const ExportProfileModal = ({ open, onOpenChange, profile, captureRef }: Props) => {
  const [orientation, setOrientation] = useState<PageOrientation>('landscape');
  const [busy, setBusy] = useState<ExportFormat | null>(null);

  const run = async (format: ExportFormat) => {
    const el = captureRef.current;
    if (!el) {
      toast({ title: 'Kunde inte hitta din karta', description: 'Öppna profilvyn och försök igen.', variant: 'destructive' });
      return;
    }
    setBusy(format);
    try {
      if (format === 'png') await exportPng(profile, el);
      if (format === 'pdf') await exportPdf(profile, el, orientation);
      if (format === 'pptx') await exportPptx(profile, el);
      if (format === 'docx') await exportDocx(profile, el);
      toast({ title: 'Export klar', description: 'Filen har laddats ner.' });
      onOpenChange(false);
    } catch (e) {
      toast({
        title: 'Exporten misslyckades',
        description: e instanceof Error ? e.message : 'Försök igen.',
        variant: 'destructive',
      });
    } finally {
      setBusy(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Spara min Karriärprofil</DialogTitle>
          <DialogDescription>
            Välj i vilket format du vill spara. Allt sparas lokalt på din enhet – inget skickas någon annanstans.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-3">
          <span className="text-sm font-medium">Sidformat för PDF</span>
          <Select value={orientation} onValueChange={(v) => setOrientation(v as PageOrientation)}>
            <SelectTrigger className="w-[160px] h-11" aria-label="Sidformat"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-popover z-50">
              <SelectItem value="landscape">Liggande</SelectItem>
              <SelectItem value="portrait">Stående</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <ul className="grid gap-3 sm:grid-cols-2">
          {FORMATS.map(({ id, label, desc, icon: Icon }) => (
            <li key={id}>
              <button
                type="button"
                onClick={() => run(id)}
                disabled={!!busy}
                className="w-full h-full text-left rounded-xl border bg-card p-4 hover:border-primary hover:shadow-sm transition-all disabled:opacity-60"
              >
                <span className="flex items-center gap-2 font-semibold">
                  {busy === id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Icon className="w-4 h-4 text-primary" />}
                  {label}
                </span>
                <span className="block text-xs text-muted-foreground mt-1">{desc}</span>
              </button>
            </li>
          ))}
        </ul>

        <DialogFooter>
          <Button variant="outline" className="min-h-11" onClick={() => onOpenChange(false)}>Stäng</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
