import { useState, useCallback } from 'react';
import { 
  StudentInfo, 
  TermPlan, 
  PlannedCourse,
  Program,
  ActionItem,
} from '@/types/planning';

const generateId = () => Math.random().toString(36).substring(2, 9);

const createEmptyTerm = (semester: 'HT' | 'VT', year: string): TermPlan => ({
  id: generateId(),
  semester,
  year,
  customYearLabel: '',
  customSemesterLabel: '',
  lp1: [],
  lp2: [],
  retakeExamNotes: '',
});

const initialStudentInfo: StudentInfo = {
  name: '',
  program: 'D',
  yearGroup: '',
  counselorId: 'joakim',
};

export const usePlanningState = (initialCounselorId?: string) => {
  const [currentTab, setCurrentTab] = useState(1);
  const [studentInfo, setStudentInfo] = useState<StudentInfo>({
    ...initialStudentInfo,
    counselorId: initialCounselorId || 'joakim',
  });
  const [agenda, setAgenda] = useState('');
  const [terms, setTerms] = useState<TermPlan[]>([
    createEmptyTerm('VT', '2026'),
  ]);
  const [notes, setNotes] = useState('');
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);

  const addActionItem = useCallback(() => {
    setActionItems(prev => [...prev, { id: generateId(), activity: '', comment: '', done: false }]);
  }, []);

  const updateActionItem = useCallback((id: string, updates: Partial<ActionItem>) => {
    setActionItems(prev => prev.map(item => item.id === id ? { ...item, ...updates } : item));
  }, []);

  const removeActionItem = useCallback((id: string) => {
    setActionItems(prev => prev.filter(item => item.id !== id));
  }, []);

  const updateStudentInfo = useCallback((updates: Partial<StudentInfo>) => {
    setStudentInfo(prev => ({ ...prev, ...updates }));
  }, []);

  const addTerm = useCallback(() => {
    setTerms(prev => {
      const lastTerm = prev[prev.length - 1];
      const nextSemester = lastTerm.semester === 'HT' ? 'VT' : 'HT';
      const nextYear = lastTerm.semester === 'VT' 
        ? (parseInt(lastTerm.year) + 1).toString() 
        : lastTerm.year;
      return [...prev, createEmptyTerm(nextSemester, nextYear)];
    });
  }, []);

  const removeTerm = useCallback((termId: string) => {
    setTerms(prev => prev.filter(t => t.id !== termId));
  }, []);

  const updateTerm = useCallback((termId: string, updates: Partial<TermPlan>) => {
    setTerms(prev => prev.map(term => {
      if (term.id !== termId) return term;
      return { ...term, ...updates };
    }));
  }, []);

  const addCourseToTerm = useCallback((
    termId: string, 
    period: 'lp1' | 'lp2', 
    course: PlannedCourse
  ) => {
    setTerms(prev => prev.map(term => {
      if (term.id !== termId) return term;
      return {
        ...term,
        [period]: [...term[period], { ...course, id: generateId() }],
      };
    }));
  }, []);

  const removeCourseFromTerm = useCallback((
    termId: string, 
    period: 'lp1' | 'lp2', 
    courseId: string
  ) => {
    setTerms(prev => prev.map(term => {
      if (term.id !== termId) return term;
      return {
        ...term,
        [period]: term[period].filter(c => c.id !== courseId),
      };
    }));
  }, []);

  const updateCourseInTerm = useCallback((
    termId: string,
    period: 'lp1' | 'lp2',
    courseId: string,
    updates: Partial<PlannedCourse>
  ) => {
    setTerms(prev => prev.map(term => {
      if (term.id !== termId) return term;
      return {
        ...term,
        [period]: term[period].map(c => 
          c.id === courseId ? { ...c, ...updates } : c
        ),
      };
    }));
  }, []);

  const setRetakeExamNotes = useCallback((termId: string, notes: string) => {
    setTerms(prev => prev.map(term => {
      if (term.id !== termId) return term;
      return { ...term, retakeExamNotes: notes };
    }));
  }, []);

  const resetPlan = useCallback(() => {
    setStudentInfo(initialStudentInfo);
    setAgenda('');
    setTerms([createEmptyTerm('VT', '2026')]);
    setNotes('');
    setActionItems([]);
    setCurrentTab(1);
  }, []);

  return {
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
    updateCourseInTerm,
    setRetakeExamNotes,
    notes,
    setNotes,
    actionItems,
    setActionItems,
    addActionItem,
    updateActionItem,
    removeActionItem,
    resetPlan,
  };
};
