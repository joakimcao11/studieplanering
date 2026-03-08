import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Pencil, Trash2, Save, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { usePrograms, ProgramData } from '@/hooks/usePrograms';

interface ProgramForm {
  code: string;
  name: string;
  link_url: string;
}

const emptyForm: ProgramForm = { code: '', name: '', link_url: '' };

export const ProgramManagementTab = () => {
  const { toast } = useToast();
  const { programs, loading, refetch } = usePrograms();
  const [dialog, setDialog] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProgramForm>(emptyForm);

  const openNew = () => {
    setForm(emptyForm);
    setEditingId(null);
    setDialog(true);
  };

  const openEdit = (p: ProgramData) => {
    setForm({ code: p.code, name: p.name, link_url: p.link_url });
    setEditingId(p.id);
    setDialog(true);
  };

  const save = async () => {
    const data = {
      code: form.code.trim().toUpperCase(),
      name: form.name.trim(),
      link_url: form.link_url.trim(),
    };
    if (!data.code || !data.name) {
      toast({ title: 'Fyll i kod och namn', variant: 'destructive' });
      return;
    }

    let error;
    if (editingId) {
      ({ error } = await supabase.from('programs').update(data).eq('id', editingId));
    } else {
      ({ error } = await supabase.from('programs').insert(data));
    }

    if (error) {
      toast({ title: 'Fel vid sparning', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: editingId ? 'Program uppdaterat' : 'Program tillagt' });
      setDialog(false);
      refetch();
    }
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from('programs').delete().eq('id', id);
    if (!error) {
      toast({ title: 'Program borttaget' });
      refetch();
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Utbildningsprogram</CardTitle>
            <Button onClick={openNew} size="sm">
              <Plus className="w-4 h-4 mr-1" />
              Nytt program
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground text-center py-8">Laddar...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-20">Kod</TableHead>
                  <TableHead>Namn</TableHead>
                  <TableHead>Programsida</TableHead>
                  <TableHead className="w-24">Åtgärd</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {programs.map(p => (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono font-bold">{p.code}</TableCell>
                    <TableCell>{p.name}</TableCell>
                    <TableCell>
                      {p.link_url ? (
                        <a
                          href={p.link_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline flex items-center gap-1 text-sm"
                        >
                          <ExternalLink className="w-3 h-3" />
                          Länk
                        </a>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => openEdit(p)} className="h-7 w-7 p-0">
                          <Pencil className="w-3 h-3" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => remove(p.id)} className="h-7 w-7 p-0 text-destructive hover:text-destructive">
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Redigera program' : 'Nytt utbildningsprogram'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label className="text-sm">Programkod *</Label>
              <Input
                value={form.code}
                onChange={e => setForm(f => ({ ...f, code: e.target.value }))}
                placeholder="D"
                maxLength={10}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-sm">Programnamn *</Label>
              <Input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Civilingenjör i Datateknik"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-sm">Länk till programsida</Label>
              <Input
                value={form.link_url}
                onChange={e => setForm(f => ({ ...f, link_url: e.target.value }))}
                placeholder="https://kurser.lth.se/lot/programme?..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(false)}>Avbryt</Button>
            <Button onClick={save}>
              <Save className="w-4 h-4 mr-1" />
              Spara
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
