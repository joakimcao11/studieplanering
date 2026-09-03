import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onCreate: (title: string, question: string) => void;
}

export const CustomCategoryModal = ({ open, onOpenChange, onCreate }: Props) => {
  const [title, setTitle] = useState('');
  const [question, setQuestion] = useState('');

  const submit = () => {
    if (!title.trim()) return;
    onCreate(title, question);
    setTitle('');
    setQuestion('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-popover">
        <DialogHeader>
          <DialogTitle>Lägg till eget område</DialogTitle>
          <DialogDescription>Ditt område fungerar precis som de andra – med egna ord och max åtta val.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="cc-title">Namn på området</Label>
            <Input id="cc-title" value={title} onChange={(e) => setTitle(e.target.value)} className="h-11" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cc-question">Fråga / beskrivning</Label>
            <Input id="cc-question" value={question} onChange={(e) => setQuestion(e.target.value)} className="h-11" />
          </div>
          <Button className="w-full min-h-11" onClick={submit} disabled={!title.trim()}>
            Skapa området
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
