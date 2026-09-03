import { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft, ArrowRight, Download, Home as HomeIcon, PlayCircle, Plus, RotateCcw, Save, Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription,
  AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useCareerProfile } from '@/hooks/useCareerProfile';
import { CAREER_CATEGORIES, categoriesForStep, categoryById } from '@/data/careerWordBank';
import { buildDemoProfile } from '@/data/careerDemoProfile';
import { CareerCategoryCard } from '@/components/career/CareerCategoryCard';
import { CustomCategoryModal } from '@/components/career/CustomCategoryModal';
import { CompareMyWords } from '@/components/career/CompareMyWords';
import { CareerProfileCanvas } from '@/components/career/CareerProfileCanvas';
import { ProfileReflection } from '@/components/career/ProfileReflection';
import { NextStepSection } from '@/components/career/NextStepSection';
import { ExportProfileModal } from '@/components/career/ExportProfileModal';
import type { CareerProfile as CareerProfileType, WizardStepId } from '@/types/careerProfile';
import lthLogo from '@/assets/lth-logo.png';

const STEPS: { id: WizardStepId; label: string; title: string; intro?: string }[] = [
  { id: 'start', label: 'Start', title: 'Min Karriärprofil' },
  {
    id: 'self',
    label: 'Jag',
    title: 'Så här skulle jag beskriva mig själv',
    intro: 'Välj de ord som känns mest lika dig. Det finns inga rätt eller fel – du kan ändra dig när du vill.',
  },
  {
    id: 'important',
    label: 'Viktigt',
    title: 'Det här är viktigt för mig',
    intro: 'Vad behöver finnas där för att du ska trivas? Tänk på både studier, jobb och livet runt omkring.',
  },
  {
    id: 'can',
    label: 'Kan',
    title: 'Det här kan jag och tar med mig',
    intro: 'Sådant du kan, har lärt dig eller varit med om. Både från studier och från allt annat.',
  },
  {
    id: 'curious',
    label: 'Nyfiken',
    title: 'Det här är jag nyfiken på',
    intro: 'Det du undrar över, vill lära dig mer om eller skulle vilja testa.',
  },
  { id: 'compare', label: 'Jämför', title: 'Jämför mina ord' },
  { id: 'profile', label: 'Min profil', title: 'Min Karriärprofil' },
  { id: 'reflect', label: 'Reflektion', title: 'Reflektion' },
  { id: 'export', label: 'Spara', title: 'Spara och ta med dig' },
];

const CareerProfilePage = () => {
  const {
    profile, setProfile, savedAt, updateCategory, toggleItem, addCustomItem, updateCustomItem,
    removeItem, moveItem, addCustomCategory, removeCategory, reset, totalWords,
  } = useCareerProfile();

  const [stepIndex, setStepIndex] = useState(0);
  const [customOpen, setCustomOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const captureRef = useRef<HTMLDivElement>(null);
  const step = STEPS[stepIndex];

  const patch = (p: Partial<CareerProfileType>) => setProfile((prev) => ({ ...prev, ...p }));

  const stepCategories = useMemo(() => {
    const recommended = categoriesForStep(step.id).map((d) => d.id as string);
    return profile.categories.filter(
      (c) => recommended.includes(c.id) || (c.type === 'custom' && step.id === 'curious'),
    );
  }, [profile.categories, step.id]);

  const go = (i: number) => {
    setStepIndex(Math.max(0, Math.min(STEPS.length - 1, i)));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b bg-card sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
          <Link to="/" className="flex items-center gap-3 min-w-0" aria-label="Till startsidan">
            <img src={lthLogo} alt="LTH" className="h-8 w-auto" />
            <div className="min-w-0">
              <p className="font-bold leading-tight truncate">Min Karriärprofil</p>
              <p className="text-xs text-muted-foreground truncate">Studie- och karriärvägledningen LTH</p>
            </div>
          </Link>
          <div className="flex-1" />
          <span className="hidden sm:inline text-xs text-muted-foreground">
            {savedAt ? (
              <span className="inline-flex items-center gap-1"><Save className="w-3.5 h-3.5" /> Sparad lokalt</span>
            ) : null}
          </span>
          <Button variant="ghost" size="icon" asChild aria-label="Till startsidan" className="min-h-11 min-w-11">
            <Link to="/"><HomeIcon className="w-5 h-5" /></Link>
          </Button>
        </div>

        {/* Stegnavigering */}
        <nav aria-label="Steg" className="border-t bg-secondary/30 overflow-x-auto">
          <ol className="max-w-6xl mx-auto px-4 sm:px-6 flex gap-1 min-w-max">
            {STEPS.map((s, i) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => go(i)}
                  aria-current={i === stepIndex ? 'step' : undefined}
                  className={`px-3 py-2 text-xs sm:text-sm font-medium border-b-2 transition-colors min-h-11 ${
                    i === stepIndex
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {i + 1}. {s.label}
                </button>
              </li>
            ))}
          </ol>
        </nav>
      </header>

      <main className="flex-1">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
          {step.id === 'start' ? (
            <section className="space-y-8">
              <div className="rounded-2xl bg-primary text-primary-foreground p-8 sm:p-12">
                <p className="text-xs uppercase tracking-widest opacity-80 mb-2">Interaktivt verktyg</p>
                <h1 className="text-3xl sm:text-4xl font-bold mb-4">Min Karriärprofil</h1>
                <p className="max-w-2xl opacity-90">
                  Ett verktyg som hjälper dig att sätta ord på vem du är, vad som är viktigt för dig, vad du kan och vad
                  du är nyfiken på. Du får inget facit och ingen yrkesrekommendation – du bygger din egen bild, i din
                  egen takt.
                </p>
                <div className="flex flex-wrap gap-3 mt-6">
                  <Button variant="secondary" className="min-h-11" onClick={() => go(1)}>
                    Börja bygga min profil <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                  <Button
                    variant="outline"
                    className="min-h-11 bg-transparent text-primary-foreground border-primary-foreground/40 hover:bg-primary-foreground/10"
                    onClick={() => {
                      setProfile(buildDemoProfile());
                      go(6);
                    }}
                  >
                    <PlayCircle className="w-4 h-4 mr-1" /> Visa exempelprofil
                  </Button>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  { t: 'Inget konto behövs', d: 'Allt du skriver sparas bara i din egen webbläsare.' },
                  { t: 'Du bestämmer takten', d: 'Hoppa mellan stegen, ändra dig och komplettera när du vill.' },
                  { t: 'Ta med dig resultatet', d: 'Spara som bild, PDF, Word eller PowerPoint – t.ex. inför ett vägledningssamtal.' },
                ].map((c) => (
                  <div key={c.t} className="rounded-xl border bg-card p-5">
                    <p className="font-semibold flex items-center gap-2"><Sparkles className="w-4 h-4 text-accent" /> {c.t}</p>
                    <p className="text-sm text-muted-foreground mt-1">{c.d}</p>
                  </div>
                ))}
              </div>

              <div className="rounded-xl border bg-card p-6 max-w-xl">
                <label htmlFor="profile-name" className="font-semibold">Vad vill du kalla din profil?</label>
                <p className="text-sm text-muted-foreground mb-3">
                  T.ex. ditt namn eller något som beskriver var du är just nu. Du kan ändra det senare.
                </p>
                <Input
                  id="profile-name"
                  value={profile.profileName}
                  onChange={(e) => patch({ profileName: e.target.value })}
                  placeholder="Min Karriärprofil"
                  className="h-11"
                />
              </div>
            </section>
          ) : (
            <section className="space-y-6">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold">{step.title}</h1>
                {step.intro && <p className="text-muted-foreground mt-1 max-w-3xl">{step.intro}</p>}
              </div>

              {['self', 'important', 'can', 'curious'].includes(step.id) && (
                <>
                  <div className="grid gap-5 lg:grid-cols-2">
                    {stepCategories.map((selection) => (
                      <CareerCategoryCard
                        key={selection.id}
                        def={categoryById(selection.id)}
                        selection={selection}
                        onToggle={(label) => toggleItem(selection.id, label)}
                        onAddCustom={(label) => addCustomItem(selection.id, label)}
                        onUpdateCustom={(o, n) => updateCustomItem(selection.id, o, n)}
                        onRemove={(label) => removeItem(selection.id, label)}
                        onUpdateCategory={(p) => updateCategory(selection.id, p)}
                        onDeleteCategory={
                          selection.type === 'custom' ? () => removeCategory(selection.id) : undefined
                        }
                      />
                    ))}
                  </div>
                  {step.id === 'curious' && (
                    <Button variant="outline" className="min-h-11" onClick={() => setCustomOpen(true)}>
                      <Plus className="w-4 h-4 mr-1" /> Lägg till eget område
                    </Button>
                  )}
                </>
              )}

              {step.id === 'compare' && <CompareMyWords profile={profile} onChange={patch} />}

              {step.id === 'profile' && (
                <CareerProfileCanvas
                  profile={profile}
                  onChange={patch}
                  onRenameItem={updateCustomItem}
                  onRemoveItem={removeItem}
                  onMoveItem={moveItem}
                  captureRef={captureRef}
                />
              )}

              {step.id === 'reflect' && (
                <div className="space-y-8">
                  <ProfileReflection profile={profile} onChange={(reflectionAnswers) => patch({ reflectionAnswers })} />
                  <NextStepSection profile={profile} onChange={patch} />
                </div>
              )}

              {step.id === 'export' && (
                <div className="space-y-6">
                  <p className="text-muted-foreground max-w-3xl">
                    Din profil är inte ett slutgiltigt svar – den är en bild av hur du tänker just nu. Spara den, ta med
                    den till ett vägledningssamtal eller kom tillbaka och ändra när något känns annorlunda.
                  </p>
                  <div className="rounded-xl border bg-card p-6 flex flex-wrap items-center gap-3">
                    <div className="flex-1 min-w-[200px]">
                      <p className="font-semibold">{profile.profileName || 'Min Karriärprofil'}</p>
                      <p className="text-sm text-muted-foreground">{totalWords} valda ord</p>
                    </div>
                    <Button className="min-h-11" onClick={() => setExportOpen(true)}>
                      <Download className="w-4 h-4 mr-1" /> Spara min profil
                    </Button>
                    <Button variant="outline" className="min-h-11" onClick={() => setResetOpen(true)}>
                      <RotateCcw className="w-4 h-4 mr-1" /> Börja om
                    </Button>
                  </div>
                  <CareerProfileCanvas
                    profile={profile}
                    onChange={patch}
                    onRenameItem={updateCustomItem}
                    onRemoveItem={removeItem}
                    onMoveItem={moveItem}
                    captureRef={captureRef}
                  />
                </div>
              )}
            </section>
          )}

          {/* Stegkontroller */}
          <div className="flex items-center justify-between gap-3 border-t pt-6">
            <Button variant="outline" className="min-h-11" onClick={() => go(stepIndex - 1)} disabled={stepIndex === 0}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Tillbaka
            </Button>
            <span className="text-sm text-muted-foreground">
              Steg {stepIndex + 1} av {STEPS.length}
            </span>
            <Button
              className="min-h-11"
              onClick={() => go(stepIndex + 1)}
              disabled={stepIndex === STEPS.length - 1}
            >
              Nästa <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </main>

      <CustomCategoryModal
        open={customOpen}
        onOpenChange={setCustomOpen}
        onCreate={(title, question) => addCustomCategory(title, question)}
      />
      <ExportProfileModal
        open={exportOpen}
        onOpenChange={setExportOpen}
        profile={profile}
        captureRef={captureRef}
      />
      <AlertDialog open={resetOpen} onOpenChange={setResetOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Börja om från början?</AlertDialogTitle>
            <AlertDialogDescription>
              Alla dina ord, reflektioner och inställningar tas bort från den här webbläsaren. Det går inte att ångra.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                reset();
                go(0);
              }}
            >
              Ja, börja om
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CareerProfilePage;
