import type { CareerCategoryId } from '@/types/careerProfile';
import { buildWords, type WordSpec, type WordTemplate } from './builder';

/** Generisk mall för de öppna reflektionsområdena. */
const openTpl = (context: string): WordTemplate => (label, lower) => ({
  definition: `${label} är ett exempel att utgå ifrån. Formulera gärna om det med dina egna ord.`,
  studentExample: `Tänk på ett konkret tillfälle där ${lower} funnits med för dig.`,
  careerContext: context,
  reflectionQuestion: `Vad skulle du vilja berätta om ${lower} för någon som frågade?`,
});

const build = (id: CareerCategoryId, context: string, specs: WordSpec[]) =>
  buildWords(id, openTpl(context), specs);

export const knowledge = build(
  'knowledge',
  'Kunskaper kan komma från kurser, projekt, verktyg, språk och sådant du lärt dig på egen hand.',
  [
    'Ämneskunskaper från min utbildning',
    'Teorier inom mitt område',
    'Metoder och arbetssätt',
    'Matematik',
    'Statistik',
    'Programmeringsspråk',
    'Datahantering',
    'CAD och modellering',
    'Laborativa metoder',
    'Projektmetodik',
    'Digitala verktyg',
    'Ekonomi och kalkyl',
    'Hållbarhet och miljö',
    'Regelverk och standarder',
    'Svenska',
    'Engelska',
    'Ytterligare språk',
    'Kunskap från extrajobb',
    'Kunskap från föreningsliv',
    'Kunskap jag skaffat på egen hand',
  ],
);

export const experience = build(
  'experience',
  'Erfarenheter utvecklar dig även när de inte ser ut som "riktiga jobb".',
  [
    'Studier och kurser',
    'Grupparbeten',
    'Projektkurser',
    'Examensarbete',
    'Praktik',
    'Extrajobb',
    'Sommarjobb',
    'Ideellt arbete',
    'Föreningsliv',
    'Studentliv och nation',
    'Ledaruppdrag',
    'Undervisning eller mentorskap',
    'Utlandsstudier',
    'Internationella erfarenheter',
    'Idrott eller kultur på fritiden',
    'Eget projekt',
    'Att ha startat något',
    'Att ha hanterat en svår situation',
    'Livserfarenheter',
    'Att ha bytt riktning',
  ],
);

export const learning = build(
  'learning',
  'Det du vill lära dig säger något om vilken riktning som lockar dig.',
  [
    'Fördjupa mig i mitt ämne',
    'Lära mig programmera mer',
    'Lära mig mer om AI',
    'Lära mig data och analys',
    'Bli tryggare i att presentera',
    'Utveckla mitt ledarskap',
    'Lära mig projektledning',
    'Bli bättre på att skriva',
    'Lära mig ett nytt språk',
    'Förstå arbetslivet bättre',
    'Lära mig mer om hållbarhet',
    'Lära mig samarbeta i större grupper',
    'Bli bättre på att prioritera',
    'Lära mig hantera stress',
    'Förstå hur organisationer fungerar',
    'Lära mig sälja mina idéer',
    'Bygga nätverk',
    'Lära mig söka jobb',
  ],
);

export const contribution = build(
  'contribution',
  'Ditt bidrag kan se ut på många sätt och behöver inte vara stort för att betyda något.',
  [
    'Hjälpa människor',
    'Skapa bättre teknik',
    'Bidra till hållbarhet',
    'Förbättra organisationer',
    'Utveckla samhället',
    'Skapa kunskap',
    'Bygga relationer',
    'Lösa problem',
    'Göra saker enklare för andra',
    'Sprida kunskap och lärande',
    'Öka tillgänglighet och inkludering',
    'Bidra till bättre hälsa',
    'Bidra till trygghet',
    'Bidra i mitt team',
    'Ta ansvar för helheten',
    'Ställa de frågor andra inte ställer',
  ],
);

export const world = build(
  'world',
  'Omvärlden påverkar vilka möjligheter som finns – men den bestämmer inte vad som är viktigt för dig.',
  [
    'AI och automatisering',
    'Arbetsmarknaden',
    'Ekonomin',
    'Klimatförändringar',
    'Energiomställningen',
    'Nya branscher',
    'Förändrade kompetenskrav',
    'Svårt att få första jobbet',
    'Samhällsförändringar',
    'Digitalisering',
    'Globala kriser',
    'Hybridarbete',
    'Ökad specialisering',
    'Livslångt lärande',
    'Konkurrens om jobben',
    'Nya sätt att söka jobb',
  ],
);

export const challenges = build(
  'challenges',
  'Att sätta ord på det som är svårt gör det ofta lättare att göra något åt det, eller att be om stöd.',
  [
    'Stress',
    'Osäkerhet inför framtiden',
    'Saknar arbetslivserfarenhet',
    'Svårt att veta vad jag vill',
    'Rädd att välja fel',
    'Balans mellan studier och liv',
    'Självtillit',
    'Att bygga nätverk',
    'Ekonomi',
    'Att komma igång',
    'Att slutföra',
    'Prestationskrav',
    'Att ta plats i grupp',
    'Att be om hjälp',
    'Att skriva om mig själv',
    'Intervjusituationer',
  ],
);

export const directions = build(
  'directions',
  'Det här är möjligheter att utforska – inte beslut du måste fatta.',
  [
    'Ingenjörsroller inom mitt område',
    'Utveckling och programmering',
    'Data och analys',
    'Projektledning',
    'Teknisk kommunikation',
    'Forskning och doktorandstudier',
    'Konsultroller',
    'Offentlig sektor',
    'Industri och produktion',
    'Energi och miljö',
    'Hälsa och medicinteknik',
    'Utbildning och pedagogik',
    'Startup och entreprenörskap',
    'Design och UX',
    'Hållbarhetsarbete',
    'Internationellt arbete',
    'Vidareutbildning eller kurser',
    'Ett ämnesområde jag vill fördjupa mig i',
  ],
);
