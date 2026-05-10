import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { TabNavigation } from '@/components/TabNavigation';
import { BasicInfoTab } from '@/components/BasicInfoTab';
import { PlanningTab } from '@/components/PlanningTab';
import { OverviewTab } from '@/components/OverviewTab';
import { SimplePlanningTab } from '@/components/SimplePlanningTab';
import { MeetingNotesTab } from '@/components/MeetingNotesTab';
import { OnboardingOverlay } from '@/components/OnboardingOverlay';
import { StatisticsPage } from '@/components/StatisticsPage';
import { AdminPage } from '@/components/AdminPage';
import { AppShell, ShellSection } from '@/components/AppShell';
import { usePlanningState } from '@/hooks/usePlanningState';
import { useCounselorProfiles } from '@/hooks/useCourses';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { RotateCcw, Save } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import lthLogo from '@/assets/lth-logo.png';

interface MainAppProps {
  onLogout: () => void;
  initialCounselorId: string;
  onCounselorIdChange: (id: string) => void;
}

export const MainApp = ({ onLogout, initialCounselorId, onCounselorIdChange }: MainAppProps) => {
  const [showStats, setShowStats] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [useAltView, setUseAltView] = useState<boolean>(() => {
    try { return localStorage.getItem('useAltView') === '1'; } catch { return false; }
  });
  const toggleAltView = () => {
    setUseAltView((v) => {
      const next = !v;
      try { localStorage.setItem('useAltView', next ? '1' : '0'); } catch { /* noop */ }
      return next;
    });
  };
  const { profiles } = useCounselorProfiles();
  
  // Check if current counselor is admin
  const isAdmin = profiles.some(p => p.counselor_key === initialCounselorId && p.is_admin) ||
    initialCounselorId === 'joakim' || initialCounselorId === 'tobias';
  const {
    currentTab,
    setCurrentTab,
    studentInfo,
    updateStudentInfo,
    agenda,
    setAgenda,
    terms,
    setTerms,
    addTerm,
    removeTerm,
    updateTerm,
    addCourseToTerm,
    removeCourseFromTerm,
    notes,
    setNotes,
    actionItems,
    addActionItem,
    updateActionItem,
    removeActionItem,
    resetPlan,
  } = usePlanningState(initialCounselorId);

  // Track last saved time
  useEffect(() => {
    const timer = setTimeout(() => {
      setLastSaved(new Date());
    }, 2000);
    return () => clearTimeout(timer);
  }, [terms, studentInfo, notes, agenda, actionItems]);

  const handleCounselorChange = (counselorId: string) => {
    updateStudentInfo({ counselorId });
    onCounselorIdChange(counselorId);
  };

  const formatLastSaved = () => {
    if (!lastSaved) return null;
    return lastSaved.toLocaleTimeString('sv-SE', { hour: '2-digit', minute: '2-digit' });
  };

  /* ------------- Shared section content (used by both standard and alt views) ------------- */
  const renderSection = () => {
    if (showAdmin && isAdmin) return <AdminPage onBack={() => setShowAdmin(false)} />;
    if (showStats) return <StatisticsPage onBack={() => setShowStats(false)} />;
    if (currentTab === 1) {
      return (
        <>
          <OnboardingOverlay tabId={1} />
          <PlanningTab
            program={studentInfo.program}
            terms={terms}
            notes={notes}
            onAddTerm={addTerm}
            onRemoveTerm={removeTerm}
            onAddCourse={addCourseToTerm}
            onRemoveCourse={removeCourseFromTerm}
            onUpdateTerm={updateTerm}
            onNotesChange={setNotes}
            onTermsChange={setTerms}
            onNextTab={() => setCurrentTab(0)}
            onProgramChange={(program) => updateStudentInfo({ program })}
          />
        </>
      );
    }
    if (currentTab === 0) {
      return (
        <BasicInfoTab
          studentInfo={studentInfo}
          actionItems={actionItems}
          onStudentInfoChange={updateStudentInfo}
          onActionItemsChange={{ add: addActionItem, update: updateActionItem, remove: removeActionItem }}
          onNextTab={() => setCurrentTab(2)}
          onPrevTab={() => setCurrentTab(1)}
        />
      );
    }
    if (currentTab === 2) {
      return (
        <OverviewTab
          studentInfo={studentInfo}
          agenda={agenda}
          terms={terms}
          notes={notes}
          actionItems={actionItems}
          onAgendaChange={setAgenda}
          onNotesChange={setNotes}
          onTermsChange={setTerms}
          onStudentInfoChange={updateStudentInfo}
          onPrevTab={() => setCurrentTab(0)}
        />
      );
    }
    if (currentTab === 3) {
      return (
        <>
          <OnboardingOverlay tabId={3} />
          <SimplePlanningTab />
        </>
      );
    }
    if (currentTab === 4) {
      return (
        <>
          <OnboardingOverlay tabId={4} />
          <MeetingNotesTab />
        </>
      );
    }
    return null;
  };

  /* ------------- Alt view (left sidebar shell) ------------- */
  if (useAltView) {
    const tabToSection: Record<number, ShellSection> = { 4: 'meeting', 1: 'planning', 3: 'simple', 0: 'meeting', 2: 'meeting' };
    const currentShellSection: ShellSection = showAdmin ? 'admin' : showStats ? 'stats' : (tabToSection[currentTab] ?? 'meeting');
    const handleSectionChange = (s: ShellSection) => {
      setShowAdmin(false);
      setShowStats(false);
      if (s === 'admin') setShowAdmin(true);
      else if (s === 'stats') setShowStats(true);
      else if (s === 'meeting') setCurrentTab(4);
      else if (s === 'planning') setCurrentTab(1);
      else if (s === 'simple') setCurrentTab(3);
    };
    return (
      <AppShell
        section={currentShellSection}
        onSectionChange={handleSectionChange}
        isAdmin={isAdmin}
        counselorId={studentInfo.counselorId}
        onCounselorChange={handleCounselorChange}
        onLogout={onLogout}
        onExitAltView={toggleAltView}
      >
        {renderSection()}
      </AppShell>
    );
  }

  if (showAdmin && isAdmin) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header 
          onLogout={onLogout} 
          counselorId={studentInfo.counselorId}
          onCounselorChange={handleCounselorChange}
          onShowStats={() => { setShowAdmin(false); setShowStats(true); }}
          onShowAdmin={() => setShowAdmin(true)}
          isAdmin={isAdmin}
          onToggleAltView={toggleAltView}
        />
        <main className="flex-1 container mx-auto px-4 py-6">
          <AdminPage onBack={() => setShowAdmin(false)} />
        </main>
      </div>
    );
  }

  if (showStats) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header 
          onLogout={onLogout} 
          counselorId={studentInfo.counselorId}
          onCounselorChange={handleCounselorChange}
          onShowStats={() => setShowStats(true)}
          onShowAdmin={() => { setShowStats(false); setShowAdmin(true); }}
          isAdmin={isAdmin}
          onToggleAltView={toggleAltView}
        />
        <main className="flex-1 container mx-auto px-4 py-6">
          <StatisticsPage onBack={() => setShowStats(false)} />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
        <Header 
          onLogout={onLogout} 
          counselorId={studentInfo.counselorId}
          onCounselorChange={handleCounselorChange}
          onShowStats={() => setShowStats(true)}
          onShowAdmin={() => setShowAdmin(true)}
          isAdmin={isAdmin}
          onToggleAltView={toggleAltView}
        />
      <TabNavigation currentTab={currentTab} onTabChange={setCurrentTab} />
      
      <main className="flex-1 container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          {/* Last saved indicator */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {lastSaved && (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Senast sparad: {formatLastSaved()}</span>
              </>
            )}
          </div>

          {/* New plan with confirmation */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="text-muted-foreground"
              >
                <RotateCcw className="w-4 h-4 mr-1" />
                Ny plan
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Skapa ny plan?</AlertDialogTitle>
                <AlertDialogDescription>
                  Detta raderar all nuvarande planering inklusive kurser, terminer och anteckningar. Åtgärden kan inte ångras.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Avbryt</AlertDialogCancel>
                <AlertDialogAction onClick={resetPlan}>
                  Ja, skapa ny plan
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {currentTab === 1 && (
          <>
            <OnboardingOverlay tabId={1} />
            <PlanningTab
              program={studentInfo.program}
              terms={terms}
              notes={notes}
              onAddTerm={addTerm}
              onRemoveTerm={removeTerm}
              onAddCourse={addCourseToTerm}
              onRemoveCourse={removeCourseFromTerm}
              onUpdateTerm={updateTerm}
              onNotesChange={setNotes}
              onTermsChange={setTerms}
              onNextTab={() => setCurrentTab(0)}
              onProgramChange={(program) => updateStudentInfo({ program })}
            />
          </>
        )}

        {currentTab === 0 && (
          <BasicInfoTab
            studentInfo={studentInfo}
            actionItems={actionItems}
            onStudentInfoChange={updateStudentInfo}
            onActionItemsChange={{
              add: addActionItem,
              update: updateActionItem,
              remove: removeActionItem,
            }}
            onNextTab={() => setCurrentTab(2)}
            onPrevTab={() => setCurrentTab(1)}
          />
        )}
        
        {currentTab === 2 && (
          <OverviewTab
            studentInfo={studentInfo}
            agenda={agenda}
            terms={terms}
            notes={notes}
            actionItems={actionItems}
            onAgendaChange={setAgenda}
            onNotesChange={setNotes}
            onTermsChange={setTerms}
            onStudentInfoChange={updateStudentInfo}
            onPrevTab={() => setCurrentTab(0)}
          />
        )}
        
        {currentTab === 3 && (
          <>
            <OnboardingOverlay tabId={3} />
            <SimplePlanningTab />
          </>
        )}
        
        {currentTab === 4 && (
          <>
            <OnboardingOverlay tabId={4} />
            <MeetingNotesTab />
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-4">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Studie- och karriärvägledningen LTH
          </p>
          <img 
            src={lthLogo} 
            alt="LTH - Faculty of Engineering" 
            className="h-10"
          />
        </div>
      </footer>
    </div>
  );
};
