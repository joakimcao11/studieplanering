import { Header } from '@/components/Header';
import { TabNavigation } from '@/components/TabNavigation';
import { BasicInfoTab } from '@/components/BasicInfoTab';
import { PlanningTab } from '@/components/PlanningTab';
import { OverviewTab } from '@/components/OverviewTab';
import { usePlanningState } from '@/hooks/usePlanningState';
import { Button } from '@/components/ui/button';
import { RotateCcw } from 'lucide-react';
import lthLogo from '@/assets/lth-logo.png';

interface MainAppProps {
  onLogout: () => void;
}

export const MainApp = ({ onLogout }: MainAppProps) => {
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
    resetPlan,
  } = usePlanningState();

  const handleCounselorChange = (counselorId: string) => {
    updateStudentInfo({ counselorId });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header 
        onLogout={onLogout} 
        counselorId={studentInfo.counselorId}
        onCounselorChange={handleCounselorChange}
      />
      <TabNavigation currentTab={currentTab} onTabChange={setCurrentTab} />
      
      <main className="flex-1 container mx-auto px-4 py-6">
        <div className="flex justify-end mb-4">
          <Button
            variant="outline"
            size="sm"
            onClick={resetPlan}
            className="text-muted-foreground"
          >
            <RotateCcw className="w-4 h-4 mr-1" />
            Ny plan
          </Button>
        </div>

        {currentTab === 0 && (
          <BasicInfoTab
            studentInfo={studentInfo}
            agenda={agenda}
            onStudentInfoChange={updateStudentInfo}
            onAgendaChange={setAgenda}
          />
        )}
        
        {currentTab === 1 && (
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
          />
        )}
        
        {currentTab === 2 && (
          <OverviewTab
            studentInfo={studentInfo}
            agenda={agenda}
            terms={terms}
            notes={notes}
            onAgendaChange={setAgenda}
            onNotesChange={setNotes}
            onTermsChange={setTerms}
            onStudentInfoChange={updateStudentInfo}
          />
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
