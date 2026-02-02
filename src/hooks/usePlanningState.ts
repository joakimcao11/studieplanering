import { useState, useCallback } from 'react';
import { 
  StudentInfo, 
  TermPlan, 
  PlannedCourse, 
  RetakeExamPeriod,
  Program 
} from '@/types/planning';

const generateId = () => Math.random().toString(36).substring(2, 9);

const createEmptyTerm = (semester: 'HT' | 'VT', year: string): TermPlan => ({
  id: generateId(),
  semester,
  year,
  lp1: [],
  lp2: [],
  retakeExam: null,
});

const initialStudentInfo: StudentInfo = {
  name: '',
  program: 'D',
  yearGroup: '',
  counselor: 'Joakim Cao',
};

export const usePlanningState = () => {
  const [currentTab, setCurrentTab] = useState(0);
  const [studentInfo, setStudentInfo] = useState<StudentInfo>(initialStudentInfo);
  const [agenda, setAgenda] = useState('');
  const [terms, setTerms] = useState<TermPlan[]>([
    createEmptyTerm('HT', new Date().getFullYear().toString()),
  ]);
  const [notes, setNotes] = useState('');

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

  const setRetakeExam = useCallback((termId: string, period: RetakeExamPeriod) => {
    setTerms(prev => prev.map(term => {
      if (term.id !== termId) return term;
      return { ...term, retakeExam: period };
    }));
  }, []);

  const resetPlan = useCallback(() => {
    setStudentInfo(initialStudentInfo);
    setAgenda('');
    setTerms([createEmptyTerm('HT', new Date().getFullYear().toString())]);
    setNotes('');
    setCurrentTab(0);
  }, []);

  return {
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
    resetPlan,
  };
};
