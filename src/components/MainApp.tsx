import { useState } from 'react';
import { Header } from '@/components/Header';
import { TabNavigation } from '@/components/TabNavigation';
import { BasicInfoTab } from '@/components/BasicInfoTab';
import { PlanningTab } from '@/components/PlanningTab';
import { OverviewTab } from '@/components/OverviewTab';
import { SimplePlanningTab } from '@/components/SimplePlanningTab';
import { TextToTextTab } from '@/components/TextToTextTab';
import { StatisticsPage } from '@/components/StatisticsPage';
import { usePlanningState } from '@/hooks/usePlanningState';
import { Button } from '@/components/ui/button';
import { RotateCcw } from 'lucide-react';
import lthLogo from '@/assets/lth-logo.png';

interface MainAppProps {
  onLogout: () => void;
  initialCounselorId: string;
  onCounselorIdChange: (id: string) => void;
}

export const MainApp = ({ onLogout, initialCounselorId, onCounselorIdChange }: MainAppProps) => {
  const [showStats, setShowStats] = useState(false);
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

  const handleCounselorChange = (counselorId: string) => {
    updateStudentInfo({ counselorId });
    onCounselorIdChange(counselorId);
  };

  if (showStats) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header 
          onLogout={onLogout} 
          counselorId={studentInfo.counselorId}
          onCounselorChange={handleCounselorChange}
          onShowStats={() => setShowStats(true)}
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
            onNextTab={() => setCurrentTab(0)}
            onProgramChange={(program) => updateStudentInfo({ program })}
          />
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
          <SimplePlanningTab />
        )}
        
        {currentTab === 4 && (
          <TextToTextTab />
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
