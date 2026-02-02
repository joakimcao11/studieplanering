// Course data for D and C programs at LTH

export interface Course {
  id: string;
  code: string;
  name: string;
  hp: number;
  level: string;
  year: number;
  period?: string;
  isObligatory: boolean;
  program: 'D' | 'C';
}

// Datateknik (D) courses
export const dProgramCourses: Course[] = [
  // Årskurs 1
  { id: 'd-1', code: 'FMAB65', name: 'Endimensionell analys B1', hp: 7.5, level: 'G1', year: 1, isObligatory: true, program: 'D' },
  { id: 'd-2', code: 'EDAB05', name: 'Programmering, grundkurs', hp: 10.5, level: 'G1', year: 1, isObligatory: true, program: 'D' },
  { id: 'd-3', code: 'FMAB70', name: 'Endimensionell analys B2', hp: 7.5, level: 'G1', year: 1, isObligatory: true, program: 'D' },
  { id: 'd-4', code: 'EXTA65', name: 'Kognition', hp: 4.5, level: 'G1', year: 1, isObligatory: true, program: 'D' },
  { id: 'd-5', code: 'FAFA60', name: 'Fotonik', hp: 5.0, level: 'G1', year: 1, isObligatory: true, program: 'D' },
  { id: 'd-6', code: 'EDAA01', name: 'Programmeringsteknik - fördjupningskurs', hp: 7.5, level: 'G1', year: 1, isObligatory: true, program: 'D' },
  { id: 'd-7', code: 'EDAA35', name: 'Utvärdering av programvarusystem', hp: 7.0, level: 'G1', year: 1, isObligatory: true, program: 'D' },
  { id: 'd-8', code: 'EDAA40', name: 'Diskreta strukturer i datavetenskap', hp: 5.0, level: 'G1', year: 1, isObligatory: true, program: 'D' },
  { id: 'd-9', code: 'FMAB20', name: 'Linjär algebra', hp: 6.0, level: 'G1', year: 1, isObligatory: true, program: 'D' },
  { id: 'd-10', code: 'EDAA75', name: 'Diskreta strukturer', hp: 7.5, level: 'G1', year: 1, isObligatory: false, program: 'D' },
  // Årskurs 2
  { id: 'd-11', code: 'FMAB30', name: 'Flerdimensionell analys', hp: 6.0, level: 'G1', year: 2, isObligatory: true, program: 'D' },
  { id: 'd-12', code: 'EDAF60', name: 'Objektorienterad modellering och design', hp: 4.5, level: 'G2', year: 2, isObligatory: true, program: 'D' },
  { id: 'd-13', code: 'EITF65', name: 'Digitalteknik', hp: 9.0, level: 'G2', year: 2, isObligatory: true, program: 'D' },
  { id: 'd-14', code: 'EITF45', name: 'Datorkommunikation', hp: 7.5, level: 'G2', year: 2, isObligatory: true, program: 'D' },
  { id: 'd-15', code: 'EDAF45', name: 'Programvaruutveckling i grupp - projekt', hp: 7.5, level: 'G2', year: 2, period: '3', isObligatory: true, program: 'D' },
  { id: 'd-16', code: 'EITF70', name: 'Datorteknik', hp: 6.0, level: 'G2', year: 2, period: '3', isObligatory: true, program: 'D' },
  { id: 'd-17', code: 'FMAF10', name: 'Tillämpad matematik - Linjära system', hp: 5.0, level: 'G2', year: 2, isObligatory: true, program: 'D' },
  { id: 'd-18', code: 'FMSF50', name: 'Matematisk statistik, allmän kurs', hp: 7.5, level: 'G2', year: 2, isObligatory: true, program: 'D' },
  { id: 'd-19', code: 'EDAF55', name: 'Realtidsprogrammering', hp: 6.0, level: 'G2', year: 2, period: '4', isObligatory: true, program: 'D' },
  { id: 'd-20', code: 'ETSF25', name: 'Affärsdriven programvaruutveckling', hp: 6.0, level: 'G2', year: 2, period: '4', isObligatory: true, program: 'D' },
  // Årskurs 3
  { id: 'd-21', code: 'EDAN35', name: 'Högpresterande datorgrafik', hp: 7.5, level: 'A', year: 3, isObligatory: false, program: 'D' },
  { id: 'd-22', code: 'EDAF50', name: 'C++ programmering', hp: 7.5, level: 'G2', year: 3, isObligatory: false, program: 'D' },
  { id: 'd-23', code: 'EDAF75', name: 'Databasteknik', hp: 7.5, level: 'G2', year: 3, isObligatory: true, program: 'D' },
  { id: 'd-24', code: 'EDAG01', name: 'Effektiv C', hp: 7.5, level: 'G2', year: 3, isObligatory: false, program: 'D' },
  { id: 'd-25', code: 'EDAN65', name: 'Kompilatorer', hp: 7.5, level: 'A', year: 3, isObligatory: false, program: 'D' },
];

// Infocom (C) courses
export const cProgramCourses: Course[] = [
  // Årskurs 1
  { id: 'c-1', code: 'FMAB65', name: 'Endimensionell analys B1', hp: 7.5, level: 'G1', year: 1, isObligatory: true, program: 'C' },
  { id: 'c-2', code: 'EDAB05', name: 'Programmering, grundkurs', hp: 10.5, level: 'G1', year: 1, isObligatory: true, program: 'C' },
  { id: 'c-3', code: 'FMAB70', name: 'Endimensionell analys B2', hp: 7.5, level: 'G1', year: 1, isObligatory: true, program: 'C' },
  { id: 'c-4', code: 'EITA66', name: 'Digitalisering - realisering och systemdesign', hp: 12.0, level: 'G1', year: 1, isObligatory: true, program: 'C' },
  { id: 'c-5', code: 'EDAA01', name: 'Programmeringsteknik - fördjupningskurs', hp: 7.5, level: 'G1', year: 1, period: '3', isObligatory: true, program: 'C' },
  { id: 'c-6', code: 'MAMA20', name: 'Kognition och interaktionsdesign', hp: 7.5, level: 'G1', year: 1, period: '3', isObligatory: true, program: 'C' },
  { id: 'c-7', code: 'EDAA75', name: 'Diskreta strukturer', hp: 7.5, level: 'G1', year: 1, isObligatory: true, program: 'C' },
  // Årskurs 2
  { id: 'c-8', code: 'EITA55', name: 'Kommunikationssystem', hp: 7.5, level: 'G1', year: 2, isObligatory: true, program: 'C' },
  { id: 'c-9', code: 'EDAF60', name: 'Objektorienterad modellering och design', hp: 4.5, level: 'G2', year: 2, isObligatory: true, program: 'C' },
  { id: 'c-10', code: 'MAMF60', name: 'Interaktionsdesign, processkurs', hp: 7.5, level: 'G2', year: 2, period: '2', isObligatory: true, program: 'C' },
  { id: 'c-11', code: 'FMAA21', name: 'Linjär algebra med numeriska tillämpningar', hp: 7.5, level: 'G1', year: 2, isObligatory: true, program: 'C' },
  { id: 'c-12', code: 'EDAF45', name: 'Programvaruutveckling i grupp - projekt', hp: 7.5, level: 'G2', year: 2, isObligatory: true, program: 'C' },
  { id: 'c-13', code: 'EITA25', name: 'Datasäkerhet', hp: 7.5, level: 'G1', year: 2, isObligatory: true, program: 'C' },
  { id: 'c-14', code: 'FMIF45', name: 'Hållbarhet och resursanvändning', hp: 4.0, level: 'G2', year: 2, isObligatory: true, program: 'C' },
  { id: 'c-15', code: 'ETSF10', name: 'Internetprotokoll', hp: 7.5, level: 'G2', year: 2, isObligatory: true, program: 'C' },
  { id: 'c-16', code: 'FMSF50', name: 'Matematisk statistik, allmän kurs', hp: 7.5, level: 'G2', year: 2, isObligatory: true, program: 'C' },
  // Årskurs 3
  { id: 'c-17', code: 'EITF05', name: 'Webbsäkerhet', hp: 4.0, level: 'G2', year: 3, isObligatory: true, program: 'C' },
  { id: 'c-18', code: 'EDAF75', name: 'Databasteknik', hp: 7.5, level: 'G2', year: 3, isObligatory: true, program: 'C' },
  { id: 'c-19', code: 'MAMN10', name: 'Användbarhetsutvärdering', hp: 6.0, level: 'A', year: 3, isObligatory: true, program: 'C' },
  { id: 'c-20', code: 'EITN41', name: 'Avancerad webbsäkerhet', hp: 7.5, level: 'A', year: 3, isObligatory: false, program: 'C' },
];

export const getAllCourses = (program: 'D' | 'C'): Course[] => {
  return program === 'D' ? dProgramCourses : cProgramCourses;
};
