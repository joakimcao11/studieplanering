import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, RotateCcw, Image, Upload, Link } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTemplateSettings, TemplateSettings } from '@/hooks/useTemplateSettings';

export const TemplateSettingsTab = () => {
  const { toast } = useToast();
  const { settings, loading, updateSetting, refetch } = useTemplateSettings();
  const [form, setForm] = useState<TemplateSettings>(settings);
  const [saving, setSaving] = useState(false);
  const [imageMode, setImageMode] = useState<'url' | 'upload'>('url');
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setForm(settings);
  }, [settings]);

  const handleSave = async () => {
    setSaving(true);
    const keys = Object.keys(form) as (keyof TemplateSettings)[];
    let hasError = false;
    for (const key of keys) {
      if (form[key] !== settings[key]) {
        const error = await updateSetting(key, form[key]);
        if (error) hasError = true;
      }
    }
    setSaving(false);
    if (hasError) {
      toast({ title: 'Fel vid sparning', variant: 'destructive' });
    } else {
      toast({ title: 'Mallinställningar sparade!' });
      refetch();
    }
  };

  const handleReset = () => {
    setForm(settings);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `footer-images/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('template-assets').upload(path, file, { upsert: true });
    if (error) {
      toast({ title: 'Uppladdning misslyckades', variant: 'destructive' });
    } else {
      const { data: urlData } = supabase.storage.from('template-assets').getPublicUrl(path);
      setForm(f => ({ ...f, footer_image_url: urlData.publicUrl }));
      toast({ title: 'Bild uppladdad!' });
    }
    setUploading(false);
  };

  if (loading) {
    return <p className="text-muted-foreground text-center py-8">Laddar inställningar...</p>;
  }

  const fontOptions = [
    'Times New Roman', 'Arial', 'Calibri', 'Georgia', 'Garamond',
    'Cambria', 'Verdana', 'Tahoma', 'Helvetica',
  ];

  // Convert half-points to pt for display
  const halfPtToPt = (v: string) => (parseInt(v) / 2).toString();
  const ptToHalfPt = (v: string) => (parseFloat(v) * 2).toString();

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Word-mall inställningar</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleReset}>
                <RotateCcw className="w-4 h-4 mr-1" />
                Återställ
              </Button>
              <Button size="sm" onClick={handleSave} disabled={saving}>
                <Save className="w-4 h-4 mr-1" />
                {saving ? 'Sparar...' : 'Spara ändringar'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Typography */}
          <div className="space-y-3">
            <h4 className="font-semibold text-foreground">Typografi</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-sm">Typsnitt</Label>
                <Select value={form.font_name} onValueChange={v => setForm(f => ({ ...f, font_name: v }))}>
                  <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-popover border border-border shadow-lg z-50">
                    {fontOptions.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-sm">Brödtext (pt)</Label>
                  <Input
                    type="number"
                    value={halfPtToPt(form.font_size_normal)}
                    onChange={e => setForm(f => ({ ...f, font_size_normal: ptToHalfPt(e.target.value) }))}
                    min="8" max="24" step="0.5"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-sm">Rubrik 1 (pt)</Label>
                  <Input
                    type="number"
                    value={halfPtToPt(form.font_size_heading1)}
                    onChange={e => setForm(f => ({ ...f, font_size_heading1: ptToHalfPt(e.target.value) }))}
                    min="10" max="36" step="0.5"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Document structure */}
          <div className="space-y-3">
            <h4 className="font-semibold text-foreground">Dokumentstruktur</h4>
            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="text-sm">Dokumenttitel</Label>
                <Input
                  value={form.document_title}
                  onChange={e => setForm(f => ({ ...f, document_title: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-sm">Syfte-text</Label>
                <Input
                  value={form.purpose_text}
                  onChange={e => setForm(f => ({ ...f, purpose_text: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-sm">Sidfot</Label>
                <Input
                  value={form.footer_text}
                  onChange={e => setForm(f => ({ ...f, footer_text: e.target.value }))}
                />
              </div>
            </div>
          </div>

          {/* Footer Image */}
          <div className="space-y-3">
            <h4 className="font-semibold text-foreground flex items-center gap-2">
              <Image className="w-4 h-4" />
              Sidfotsbild (höger)
            </h4>
            <div className="flex gap-2 mb-2">
              <Button
                variant={imageMode === 'url' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setImageMode('url')}
              >
                <Link className="w-4 h-4 mr-1" />
                Bildlänk
              </Button>
              <Button
                variant={imageMode === 'upload' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setImageMode('upload')}
              >
                <Upload className="w-4 h-4 mr-1" />
                Ladda upp
              </Button>
            </div>
            {imageMode === 'url' ? (
              <div className="space-y-1">
                <Label className="text-sm">Bild-URL</Label>
                <Input
                  placeholder="https://example.com/logo.png"
                  value={form.footer_image_url}
                  onChange={e => setForm(f => ({ ...f, footer_image_url: e.target.value }))}
                />
              </div>
            ) : (
              <div className="space-y-1">
                <Label className="text-sm">Ladda upp bild</Label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileUpload}
                />
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {uploading ? 'Laddar upp...' : 'Välj bild'}
                </Button>
              </div>
            )}
            {form.footer_image_url && (
              <div className="flex items-center gap-3 p-3 border rounded-md bg-muted/30">
                <img
                  src={form.footer_image_url}
                  alt="Sidfotsbild"
                  className="h-12 object-contain"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
                <span className="text-xs text-muted-foreground truncate flex-1">
                  {form.footer_image_url}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setForm(f => ({ ...f, footer_image_url: '' }))}
                >
                  Ta bort
                </Button>
              </div>
            )}
          </div>

          {/* Exam info */}
          <div className="space-y-3">
            <h4 className="font-semibold text-foreground">Examenskrav (obligatorisk bilaga)</h4>
            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="text-sm">Rubrik för examenskrav</Label>
                <Input
                  value={form.exam_info_title}
                  onChange={e => setForm(f => ({ ...f, exam_info_title: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-sm">Examenskrav-text (hela innehållet)</Label>
                <Textarea
                  value={form.exam_info_text}
                  onChange={e => setForm(f => ({ ...f, exam_info_text: e.target.value }))}
                  rows={15}
                  className="font-mono text-sm"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
