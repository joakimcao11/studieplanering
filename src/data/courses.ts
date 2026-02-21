// Course data for D and C programs at LTH

export interface Course {
  id: string;
  code: string;
  name: string;
  hp: number;
  level: string;
  year: number;
  periods?: string[]; // Array of periods: '1', '2', '3', '4'
  isObligatory: boolean;
  program: 'D' | 'C';
  isMultiPeriod?: boolean; // Course spans multiple periods
  defaultStudyPace?: number; // Default study pace for multi-period courses
}

// Datateknik (D) courses - Updated from D_programmet_2.0.docx
export const dProgramCourses: Course[] = [
  // Årskurs 1 - Obligatoriska kurser
  { id: 'd-1', code: 'FMAB65', name: 'Endimensionell analys B1', hp: 7.5, level: 'G1', year: 1, periods: ['1'], isObligatory: true, program: 'D' },
  { id: 'd-2', code: 'EDAB05', name: 'Programmering, grundkurs', hp: 10.5, level: 'G1', year: 1, periods: ['1', '2'], isObligatory: true, program: 'D', isMultiPeriod: true, defaultStudyPace: 50 },
  { id: 'd-3', code: 'FMAB70', name: 'Endimensionell analys B2', hp: 7.5, level: 'G1', year: 1, periods: ['2'], isObligatory: true, program: 'D' },
  { id: 'd-4', code: 'EXTA65', name: 'Kognition', hp: 4.5, level: 'G1', year: 1, periods: ['2'], isObligatory: true, program: 'D' },
  { id: 'd-5', code: 'FAFA60', name: 'Fotonik', hp: 5.0, level: 'G1', year: 1, periods: ['3'], isObligatory: true, program: 'D' },
  { id: 'd-6', code: 'EDAA01', name: 'Programmeringsteknik - fördjupningskurs', hp: 7.5, level: 'G1', year: 1, periods: ['3'], isObligatory: true, program: 'D' },
  { id: 'd-7', code: 'EDAA35', name: 'Utvärdering av programvarusystem', hp: 7.0, level: 'G1', year: 1, periods: ['3', '4'], isObligatory: true, program: 'D', isMultiPeriod: true, defaultStudyPace: 50 },
  { id: 'd-8', code: 'EDAA40', name: 'Diskreta strukturer i datavetenskap', hp: 5.0, level: 'G1', year: 1, periods: ['4'], isObligatory: true, program: 'D' },
  { id: 'd-9', code: 'FMAB20', name: 'Linjär algebra', hp: 6.0, level: 'G1', year: 1, periods: ['4'], isObligatory: true, program: 'D' },
  { id: 'd-10', code: 'EDAA75', name: 'Diskreta strukturer', hp: 7.5, level: 'G1', year: 1, periods: ['4'], isObligatory: false, program: 'D' },
  
  // Årskurs 2 - Obligatoriska kurser
  { id: 'd-11', code: 'FMAB30', name: 'Flerdimensionell analys', hp: 6.0, level: 'G1', year: 2, periods: ['1'], isObligatory: true, program: 'D' },
  { id: 'd-12', code: 'EDAF60', name: 'Objektorienterad modellering och design', hp: 4.5, level: 'G2', year: 2, periods: ['1'], isObligatory: true, program: 'D' },
  { id: 'd-13', code: 'EITF65', name: 'Digitalteknik', hp: 9.0, level: 'G2', year: 2, periods: ['1', '2'], isObligatory: true, program: 'D', isMultiPeriod: true, defaultStudyPace: 50 },
  { id: 'd-14', code: 'EITF45', name: 'Datorkommunikation', hp: 7.5, level: 'G2', year: 2, periods: ['2'], isObligatory: true, program: 'D' },
  { id: 'd-15', code: 'EDAF45', name: 'Programvaruutveckling i grupp - projekt', hp: 7.5, level: 'G2', year: 2, periods: ['2', '3'], isObligatory: true, program: 'D', isMultiPeriod: true, defaultStudyPace: 50 },
  { id: 'd-16', code: 'EITF70', name: 'Datorteknik', hp: 6.0, level: 'G2', year: 2, periods: ['3'], isObligatory: true, program: 'D' },
  { id: 'd-17', code: 'FMAF10', name: 'Tillämpad matematik - Linjära system', hp: 5.0, level: 'G2', year: 2, periods: ['3', '4'], isObligatory: true, program: 'D' },
  { id: 'd-18', code: 'EDAF05', name: 'Algoritmer, datastrukturer och komplexitet', hp: 5.0, level: 'G2', year: 2, periods: ['4'], isObligatory: true, program: 'D' },
  { id: 'd-19', code: 'EITA10', name: 'Elektronik', hp: 5.0, level: 'G1', year: 2, periods: ['4'], isObligatory: true, program: 'D' },
  { id: 'd-20', code: 'EDAF95', name: 'Grundläggande funktionsprogrammering', hp: 5.0, level: 'G2', year: 2, periods: ['4'], isObligatory: true, program: 'D' },
  
  // Årskurs 2 - Alternativobligatoriska kurser
  { id: 'd-21', code: 'FMAF01', name: 'Matematik – Funktionsteori', hp: 7.0, level: 'G2', year: 2, periods: ['3'], isObligatory: false, program: 'D' },
  { id: 'd-22', code: 'EDAN40', name: 'Funktionsprogrammering', hp: 7.5, level: 'A', year: 2, periods: ['4'], isObligatory: false, program: 'D' },
  { id: 'd-23', code: 'FMAF05', name: 'Matematik - System och transformer', hp: 7.0, level: 'G2', year: 2, periods: ['4'], isObligatory: false, program: 'D' },
  
  // Årskurs 3 - Obligatoriska kurser
  { id: 'd-24', code: 'EDAP10', name: 'Flertrådad programmering', hp: 7.5, level: 'A', year: 3, periods: ['1'], isObligatory: true, program: 'D' },
  { id: 'd-25', code: 'FRTF05', name: 'Reglerteknik, allmän kurs', hp: 7.5, level: 'G2', year: 3, periods: ['1'], isObligatory: true, program: 'D' },
  { id: 'd-26', code: 'ETSF25', name: 'Affärsdriven programvaruutveckling', hp: 7.5, level: 'G2', year: 3, periods: ['2'], isObligatory: true, program: 'D' },
  { id: 'd-27', code: 'FMSF20', name: 'Matematisk statistik, allmän kurs', hp: 7.5, level: 'G2', year: 3, periods: ['2'], isObligatory: true, program: 'D' },
  { id: 'd-28', code: 'EITA25', name: 'Datasäkerhet', hp: 7.5, level: 'G1', year: 3, periods: ['3'], isObligatory: true, program: 'D' },
  { id: 'd-29', code: 'FMNF05', name: 'Numerisk analys', hp: 6.0, level: 'G2', year: 3, periods: ['3'], isObligatory: true, program: 'D' },
  { id: 'd-30', code: 'FMIF45', name: 'Hållbarhet och resursanvändning med perspektiv på ICT', hp: 4.0, level: 'G2', year: 3, periods: ['3', '4'], isObligatory: true, program: 'D', isMultiPeriod: true, defaultStudyPace: 50 },
  { id: 'd-31', code: 'EITG20', name: 'Kösystem', hp: 5.0, level: 'G2', year: 3, periods: ['4'], isObligatory: true, program: 'D' },
  { id: 'd-32', code: 'EITA50', name: 'Signalbehandling i multimedia', hp: 7.5, level: 'G1', year: 3, periods: ['4'], isObligatory: true, program: 'D' },
];

// Infocom (C) courses - Updated from C_programmet_2.0.docx
export const cProgramCourses: Course[] = [
  // Årskurs 1 - Obligatoriska kurser
  { id: 'c-1', code: 'FMAB65', name: 'Endimensionell analys B1', hp: 7.5, level: 'G1', year: 1, periods: ['1'], isObligatory: true, program: 'C' },
  { id: 'c-2', code: 'EDAB05', name: 'Programmering, grundkurs', hp: 10.5, level: 'G1', year: 1, periods: ['1', '2'], isObligatory: true, program: 'C', isMultiPeriod: true, defaultStudyPace: 50 },
  { id: 'c-3', code: 'FMAB70', name: 'Endimensionell analys B2', hp: 7.5, level: 'G1', year: 1, periods: ['2'], isObligatory: true, program: 'C' },
  { id: 'c-4', code: 'EITA66', name: 'Digitalisering - realisering och systemdesign med användarperspektiv', hp: 12.0, level: 'G1', year: 1, periods: ['2', '3', '4'], isObligatory: true, program: 'C', isMultiPeriod: true, defaultStudyPace: 27 },
  { id: 'c-5', code: 'EDAA01', name: 'Programmeringsteknik - fördjupningskurs', hp: 7.5, level: 'G1', year: 1, periods: ['3'], isObligatory: true, program: 'C' },
  { id: 'c-6', code: 'MAMA20', name: 'Kognition och interaktionsdesign', hp: 7.5, level: 'G1', year: 1, periods: ['3', '4'], isObligatory: true, program: 'C', isMultiPeriod: true, defaultStudyPace: 50 },
  { id: 'c-7', code: 'EDAA75', name: 'Diskreta strukturer', hp: 7.5, level: 'G1', year: 1, periods: ['4'], isObligatory: true, program: 'C' },
  
  // Årskurs 2 - Obligatoriska kurser
  { id: 'c-8', code: 'EITA55', name: 'Kommunikationssystem', hp: 7.5, level: 'G1', year: 2, periods: ['1'], isObligatory: true, program: 'C' },
  { id: 'c-9', code: 'EDAF60', name: 'Objektorienterad modellering och design', hp: 4.5, level: 'G2', year: 2, periods: ['1'], isObligatory: true, program: 'C' },
  { id: 'c-10', code: 'MAMF60', name: 'Interaktionsdesign, processkurs', hp: 7.5, level: 'G2', year: 2, periods: ['1', '2'], isObligatory: true, program: 'C', isMultiPeriod: true, defaultStudyPace: 50 },
  { id: 'c-11', code: 'FMAA21', name: 'Linjär algebra med numeriska tillämpningar', hp: 7.5, level: 'G1', year: 2, periods: ['3'], isObligatory: true, program: 'C' },
  { id: 'c-12', code: 'EDAF45', name: 'Programvaruutveckling i grupp - projekt', hp: 7.5, level: 'G2', year: 2, periods: ['2', '3'], isObligatory: true, program: 'C', isMultiPeriod: true, defaultStudyPace: 50 },
  { id: 'c-13', code: 'EITA25', name: 'Datasäkerhet', hp: 7.5, level: 'G1', year: 2, periods: ['3'], isObligatory: true, program: 'C' },
  { id: 'c-14', code: 'FMIF45', name: 'Hållbarhet och resursanvändning med perspektiv på ICT', hp: 4.0, level: 'G2', year: 2, periods: ['3', '4'], isObligatory: true, program: 'C', isMultiPeriod: true, defaultStudyPace: 50 },
  { id: 'c-15', code: 'ETSF10', name: 'Internetprotokoll', hp: 7.5, level: 'G2', year: 2, periods: ['4'], isObligatory: true, program: 'C' },
  { id: 'c-16', code: 'FMSF50', name: 'Matematisk statistik, allmän kurs', hp: 7.5, level: 'G2', year: 2, periods: ['4'], isObligatory: true, program: 'C' },
  
  // Årskurs 3 - Obligatoriska kurser
  { id: 'c-17', code: 'ETSN11', name: 'Trådlösa nätverk och applikationer - Systemdesign och prestanda', hp: 7.5, level: 'A', year: 3, periods: ['1'], isObligatory: true, program: 'C' },
  { id: 'c-18', code: 'EDAF90', name: 'Webbprogrammering', hp: 7.5, level: 'G2', year: 3, periods: ['1'], isObligatory: true, program: 'C' },
  { id: 'c-19', code: 'ETSF25', name: 'Affärsdriven programvaruutveckling', hp: 7.5, level: 'G2', year: 3, periods: ['2'], isObligatory: true, program: 'C' },
  { id: 'c-20', code: 'EITF06', name: 'Webbsäkerhet', hp: 7.5, level: 'G2', year: 3, periods: ['2'], isObligatory: true, program: 'C' },
  { id: 'c-21', code: 'FMAF10', name: 'Tillämpad matematik - Linjära system', hp: 5.0, level: 'G2', year: 3, periods: ['2'], isObligatory: true, program: 'C' },
  { id: 'c-22', code: 'MAMN01', name: 'Avancerad interaktionsdesign', hp: 7.5, level: 'A', year: 3, periods: ['3', '4'], isObligatory: true, program: 'C', isMultiPeriod: true, defaultStudyPace: 50 },
  { id: 'c-23', code: 'EDAF75', name: 'Databasteknik', hp: 7.5, level: 'G2', year: 3, periods: ['3', '4'], isObligatory: true, program: 'C', isMultiPeriod: true, defaultStudyPace: 50 },
  { id: 'c-24', code: 'EITG20', name: 'Kösystem', hp: 5.0, level: 'G2', year: 3, periods: ['4'], isObligatory: true, program: 'C' },
  { id: 'c-25', code: 'EDAG10', name: 'Vetenskapsteori för ingenjörer', hp: 5.0, level: 'G2', year: 3, periods: ['4'], isObligatory: true, program: 'C' },
];

export const getAllCourses = (program: string): Course[] => {
  if (program === 'D') return dProgramCourses;
  if (program === 'C') return cProgramCourses;
  return []; // Custom programs have no predefined courses
};
