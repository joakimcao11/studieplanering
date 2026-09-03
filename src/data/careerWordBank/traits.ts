import { buildWords, type WordSpec, type WordTemplate } from './builder';

const tpl: WordTemplate = (label, lower) => ({
  definition: `Att vara ${lower} kan betyda att det ligger nära till hands för dig att vara ${lower} när du får arbeta på ett sätt som passar dig.`,
  studentExample: `Det kan märkas i grupparbeten, projekt, extrajobb eller på fritiden – kanske är "${label.toLowerCase()}" ett ord andra använt om dig, eller ett ord du känner igen dig i när något fungerar bra.`,
  careerContext: `Att vara ${lower} kan vara användbart i situationer och roller där just det sättet att arbeta behövs. Det är varken bättre eller sämre än andra egenskaper – det beror på sammanhang, uppgift och grupp.`,
  reflectionQuestion: `När märks din ${lower}a sida tydligast – i studierna eller utanför universitetet?`,
});

const specs: WordSpec[] = [
  'Ambitiös',
  {
    label: 'Analytisk',
    definition:
      'Du tycker ofta om att undersöka information, se samband och förstå varför något fungerar som det gör.',
    studentExample:
      'Du kanske tycker om att jämföra olika lösningar i ett projekt, tolka information eller försöka förstå ett problem innan du börjar lösa det.',
    careerContext:
      'Analytisk förmåga kan vara användbar i många olika typer av roller när man behöver bedöma information, förstå behov eller utveckla lösningar.',
    reflectionQuestion:
      'När använder du din analytiska sida i dina studier eller utanför universitetet?',
  },
  'Anpassningsbar',
  'Ansvarsfull',
  'Beslutsam',
  {
    label: 'Detaljorienterad',
    definition: 'Du lägger ofta märke till detaljer och bryr dig om att saker blir gjorda ordentligt.',
    studentExample:
      'Du kanske läser igenom en rapport en extra gång, upptäcker fel som andra missar eller vill ha koll på hur något faktiskt hänger ihop i detalj.',
    careerContext:
      'Detaljfokus kan vara värdefullt när noggrannhet spelar roll. I andra lägen kan helhetsperspektiv behövas mer – många arbetsgrupper rymmer båda.',
    reflectionQuestion: 'I vilka situationer hjälper ditt detaljfokus dig, och när behöver du zooma ut?',
  },
  'Effektiv',
  'Eftertänksam',
  {
    label: 'Empatisk',
    definition: 'Du känner ofta in hur andra har det och tar hänsyn till det i hur du agerar.',
    studentExample:
      'Du kanske märker när någon i gruppen är tyst eller stressad, och anpassar hur du säger saker.',
    careerContext:
      'Att kunna läsa av människor kan vara användbart i samarbete, bemötande, handledning och i arbete där man behöver förstå andras behov.',
    reflectionQuestion: 'När har din förmåga att känna in andra gjort skillnad för en grupp?',
  },
  'Engagerad',
  'Entusiasmerande',
  'Envis',
  {
    label: 'Extrovert',
    definition:
      'Du får ofta energi av att vara med andra människor och tänker gärna tillsammans med andra.',
    studentExample:
      'Du kanske gillar att bolla idéer högt, tar lätt kontakt med nya människor eller tycker att dagen blir bättre av många möten.',
    careerContext:
      'Extroversion säger inget om hur skicklig någon är socialt. Däremot kan det påverka vilka miljöer och arbetssätt som ger dig energi.',
    reflectionQuestion: 'I vilka sammanhang känner du att du får mest energi av andra?',
  },
  'Fantasifull',
  'Flitig',
  'Framåt',
  'Förhandlande',
  'Generös',
  'Genomförare / doer',
  'Hjälpsam',
  'Humoristisk',
  'Idealistisk',
  'Idérik',
  'Ifrågasättande',
  'Igångsättare',
  'Individualistisk',
  {
    label: 'Introvert',
    definition:
      'Du kanske föredrar att tänka och bearbeta saker i lugn och ro och återhämtar dig genom att få tid för dig själv.',
    studentExample:
      'Du kanske föredrar att förbereda dig inför ett möte, tänka igenom en fråga innan du svarar eller uppskattar djupare samtal framför stora sociala sammanhang.',
    careerContext:
      'Introversion säger inte om någon är socialt skicklig eller inte. Däremot kan det påverka vilka arbetssätt och miljöer som ger eller tar energi.',
    reflectionQuestion: 'I vilka sammanhang får du bäst möjlighet att tänka, bidra och återhämta dig?',
  },
  'Kommunikativ i skrift',
  'Kommunikativ i tal',
  'Konsekvent',
  'Konstruktiv',
  {
    label: 'Kreativ',
    definition: 'Du kommer ofta på idéer, kombinationer eller lösningar som inte var givna från början.',
    studentExample:
      'Du kanske hittar en egen vinkel på en uppgift, gillar att skissa på förslag eller ser flera möjliga vägar där andra ser en.',
    careerContext:
      'Kreativitet finns i många sammanhang – inte bara i design och konst, utan även i teknik, forskning, undervisning och verksamhetsutveckling.',
    reflectionQuestion: 'När kommer dina idéer lättast – ensam, i grupp, i rörelse eller under press?',
  },
  'Kunnig',
  'Lagspelare',
  'Ledande',
  'Logisk',
  'Lojal',
  {
    label: 'Lugn',
    definition: 'Du behåller ofta ett jämnt tempo och en jämn ton även när saker är oklara eller stressiga.',
    studentExample:
      'Du kanske är den som sänker tempot i gruppen inför en deadline, eller som kan tänka klart när något oväntat händer.',
    careerContext:
      'Lugn kan vara värdefullt i lägen med hög belastning eller osäkerhet. I andra lägen kan ett snabbare, mer pådrivande sätt behövas.',
    reflectionQuestion: 'Vad hjälper dig att behålla lugnet, och vad tär på det?',
  },
  'Lyhörd',
  'Läraktig',
  'Lösningsfokuserad',
  'Målinriktad',
  'Noggrann',
  {
    label: 'Nyfiken',
    definition: 'Du vill gärna veta mer, prova nytt och förstå sådant du ännu inte kan.',
    studentExample:
      'Du kanske läser vidare om något efter föreläsningen, ställer följdfrågor eller testar ett verktyg bara för att se hur det fungerar.',
    careerContext:
      'Nyfikenhet kan vara användbar när arbetsuppgifter förändras och man behöver lära sig nytt under arbetslivet.',
    reflectionQuestion: 'Vad var det senaste du blev nyfiken på – och vad gjorde du med det?',
  },
  'Nytänkande',
  'Objektiv',
  'Omsorgsfull',
  'Optimistisk',
  'Orädd',
  'Pedagogisk',
  'Pragmatisk',
  'Praktisk',
  'Prestigelös',
  'Pålitlig',
  'Realistisk',
  'Regelorienterad',
  'Resultatinriktad',
  'Rättvis',
  'Serviceinriktad',
  {
    label: 'Självständig',
    definition: 'Du kan ofta driva ditt arbete framåt på egen hand och tar gärna egna initiativ.',
    studentExample:
      'Du kanske trivs med att strukturera dina egna studier, eller tar tag i din del av ett projekt utan att någon säger till.',
    careerContext:
      'Självständighet kan behövas i roller med eget ansvar. Samtidigt bygger de flesta arbeten på samspel – det ena utesluter inte det andra.',
    reflectionQuestion: 'När vill du helst arbeta själv, och när blir det bättre tillsammans med andra?',
  },
  'Snabb',
  'Social',
  'Solidarisk',
  {
    label: 'Spontan',
    definition: 'Du gillar ofta att haka på, prova och ta saker efterhand hellre än att planera allt i förväg.',
    studentExample:
      'Du kanske kastar dig in i en ny idé, ändrar plan när något bättre dyker upp eller trivs när dagen ser olika ut.',
    careerContext:
      'Spontanitet är inte sämre än struktur – det passar olika bra beroende på uppgift, tempo och hur gruppen arbetar.',
    reflectionQuestion: 'När är din spontanitet en styrka, och när behöver du en plan?',
  },
  'Strategisk',
  'Stresstålig',
  {
    label: 'Strukturerad',
    definition: 'Du tycker ofta om att ha ordning, planering och överblick över vad som ska göras.',
    studentExample:
      'Du kanske gör en tidsplan inför tentaperioden, skapar listor eller håller ihop gruppens arbete.',
    careerContext:
      'Struktur kan hjälpa när flera saker ska hänga ihop över tid. Det är varken bättre eller sämre än ett mer spontant arbetssätt.',
    reflectionQuestion: 'Vad behöver du för att din struktur ska hjälpa dig snarare än begränsa dig?',
  },
  'Stödjande',
  'Systematisk',
  'Tillmötesgående',
  'Tolerant',
  'Trygg',
  'Tydlig',
  {
    label: 'Tävlingsinriktad',
    definition: 'Du får ofta energi av att mäta dig, sätta ribban högt eller nå ett tydligt resultat.',
    studentExample: 'Du kanske peppas av mål och deadlines, eller av att se att något blivit bättre än förra gången.',
    careerContext:
      'Tävlingsinriktad är inte bättre än samarbetsorienterad – olika miljöer och grupper behöver olika drivkrafter.',
    reflectionQuestion: 'Vad tävlar du helst mot: andra, dig själv eller uppgiften?',
  },
  'Undersökande',
  'Uppgiftsorienterad',
  'Uthållig',
  'Verbal',
  'Ärlig',
  'Äventyrlig',
  'Ödmjuk',
  'Öppen',
];

export const traits = buildWords('traits', tpl, specs);
