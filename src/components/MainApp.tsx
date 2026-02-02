import { Header } from '@/components/Header';
import { TabNavigation } from '@/components/TabNavigation';
import { BasicInfoTab } from '@/components/BasicInfoTab';
import { PlanningTab } from '@/components/PlanningTab';
import { OverviewTab } from '@/components/OverviewTab';
import { usePlanningState } from '@/hooks/usePlanningState';
import { exportToWord, exportToText } from '@/utils/export';
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
    addTerm,
    removeTerm,
    addCourseToTerm,
    removeCourseFromTerm,
    setRetakeExam,
    notes,
    setNotes,
  } = usePlanningState();

  const handleExportWord = () => {
    exportToWord({
      studentInfo,
      agenda,
      terms,
      notes,
    });
  };

  const handleExportText = () => {
    exportToText({
      studentInfo,
      agenda,
      terms,
      notes,
    });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header onLogout={onLogout} />
      <TabNavigation currentTab={currentTab} onTabChange={setCurrentTab} />
      
      <main className="flex-1 container mx-auto px-4 py-6">
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
            onSetRetakeExam={setRetakeExam}
            onNotesChange={setNotes}
          />
        )}
        
        {currentTab === 2 && (
          <OverviewTab
            studentInfo={studentInfo}
            agenda={agenda}
            terms={terms}
            notes={notes}
            onExportWord={handleExportWord}
            onExportText={handleExportText}
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
