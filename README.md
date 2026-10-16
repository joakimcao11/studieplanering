# Study Plan Assistant

Ta fram STUDIEPLANERINGSVERKTYG LTH 
UPPDRAG
Skapa en professionell, användarvänlig och interaktiv webbsida för studievägledning vid LTH (Lunds Tekniska Högskola) med fokus på digital studieplanering och minnesanteckningar.
Webbsidan ska byggas i HTML, CSS och JavaScript och vara helt webbaserad.
Lösningen ska vara intuitiv, lågtrösklig och anpassad för samtal i realtid, utan krav på teknisk kunskap.
Målgruppen är studievägledare.
________________________________________
1. STARTSIDA & INLOGGNING
Webbsidan ska börja med en enkel inloggnings-/behörighetssida.
Inloggningsuppgifter (hårdkodade, frontend):
•	Användarnamn: svl
•	Lösenord: admin
UX-krav:
•	Möjlighet till “Kom ihåg mig”
•	Automatisk vidarekoppling om användaren redan är inloggad
•	Syftet är enkel åtkomstkontroll, inte hög säkerhet
•	Ingen backend krävs
Efter inloggning skickas användaren till huvudsidan för studieplanering.
________________________________________
2. DESIGN & VISUELL IDENTITET
•	Inspirerad av Lunds universitets visuella identitet
•	Färgskala:
o	Primärfärg: Djup marinblå (Lund-inspirerad)
o	Sekundära färger: vit, ljusgrå
•	Stil:
o	Ren, nordisk, professionell
o	God kontrast och tydlig typografi
•	Responsiv design (desktop och surfplatta)
________________________________________
3. ÖVERGRIPANDE UX-PRINCIPER (VIKTIGT)
•	Gränssnittet ska vara uppdelat i tydliga steg/sektioner för att minska kognitiv belastning
•	Endast relevant information ska visas åt gången
•	Arbetsflödet ska stödja ett pågående samtal, inte administration i efterhand
•	Systemet ska:
o	förebygga fel
o	visualisera studietakt
o	skapa trygghet inför export
________________________________________
4. STRUKTUR – SIDANS HUVUDDELAR
Huvudsidan ska vara uppdelad i tre tydliga sektioner eller flikar:
1.	Grunduppgifter & agenda
2.	Studieplanering (kurser & hp)
3.	Överblick & sammanfattning
________________________________________
5. GRUNDUPPGIFTER & AGENDA
Grundinformation
•	Datum (autogenereras – realtid)
•	Studentens namn
•	Program:
o	Civilingenjör i Datateknik (D)
o	Civilingenjör i Infocom (C)
•	Årskull (t.ex. D20, C21)
•	Studievägledare (förifyllt)
Agenda
•	Stort fritextfält:
o	“Syftet med samtalet / agenda”
________________________________________
6. STUDIEPLANERING – STRUKTUR & LOGIK
Studieupplägg
•	Möjlighet att planera:
o	en termin
o	ett helt läsår
o	flera terminer
•	Struktur:
o	Hösttermin: LP1 + LP2
o	Vårtermin: LP3 + LP4
Grundlogik (ska vara tydlig i gränssnittet)
•	1 läsperiod = 15 hp
•	1 termin = 30 hp
•	1 läsår = 60 hp
•	100 % studietakt = 30 hp/termin
________________________________________
7. KURSHANTERING (UTÖKAD & UX-FÖRBÄTTRAD)
Fördefinierade kurser
•	Kurslistor från:
o	“D programmet”
o	“C programmet”
•	Kurser listas med:
o	kursnamn
o	antal hp
UX-förbättringar:
•	Sökfält: “Sök kurs”
•	Filtrering:
o	Obligatoriska kurser
o	Egna kurser
________________________________________
➕ EGNA KURSER (VIKTIG FUNKTION)
Användaren ska kunna lägga till egna kurser manuellt genom:
•	Textfält för kursnamn
•	Val av hp (snabbval + manuellt):
o	7,5 hp
o	15 hp
o	Eget värde
Egna kurser ska:
•	Kunna placeras i valfri läsperiod
•	Räknas med i hp-beräkningar
•	Följas med i minnesanteckningar och export
________________________________________
8. SORTERING & AUTOMATISK HP-BERÄKNING
När kurser placeras i läsperioder ska systemet automatiskt:
•	Räkna total hp per läsperiod
•	Räkna total hp per termin
•	Visa:
o	om 15 hp/läsperiod uppnås
o	om 30 hp/termin uppnås
o	om studietakten avviker
UX-krav:
•	Visa hp både:
o	numeriskt
o	visuellt (progress bar)
•	Färgkodning:
o	Grön = inom rekommenderad studietakt
o	Gul = avvikelse
o	Röd = tydlig över-/underbelastning
________________________________________
9. OMTENTAMENSPERIODER
•	Valbara alternativ:
o	April
o	Augusti
•	Ska synas:
o	i studieplaneringen
o	i minnesanteckningarna
________________________________________
10. ÖVRIGT
•	Fritextfält för övriga anteckningar
________________________________________
11. VISUELL ÖVERBLICK
Skapa en tabell eller tidslinje som visar:
•	Termin
•	Läsperiod
•	Kurser
•	Hp per läsperiod
•	Hp per termin
Denna vy ska fungera som sammanfattning inför export.
________________________________________
12. EXPORT & NEDLADDNING (OBLIGATORISKT)
Användaren ska kunna:
•	Förhandsgranska minnesanteckningarna
•	Ladda ner som:
o	Word (.docx)
o	Textfil (.txt)
Dokumentet ska ALLTID innehålla:
Sidhuvud (överst vänster)
STVL Joakim Cao
joakim.cao@lth.lu.se
Innehåll (i ordning)
1.	Syfte: Studieplanering med studievägledare
2.	Datum
3.	Studentens namn
4.	Program och kull
5.	Agenda
6.	Studieplanering:
o	Terminer
o	Läsperioder
o	Kurser
o	Hp per läsperiod
o	Hp per termin
Sidfot
•	Nederst vänster:
•	Studie- och karriärvägledningen LTH
•	Nederst höger:
o	LTH-logotyp
________________________________________
13. OBLIGATORISK SLUTSEKTION
Oavsett hur anteckningarna ser ut ska följande text ALLTID läggas till på sista sidan i både Word och .txt:
”Utbildningens upplägg och examenskrav
Din civilingenjörsexamen på 300 hp ska innehålla kurser enligt nedan. Dessa krav är inte behörighetskrav för att få påbörja ett examensarbete.
•	Obligatoriska kurser – ca 180 hp (Åk 1–3)
•	Kurser i specialisering – minst 45 hp, varav minst 30 hp på A-nivå (Åk 4–5)
•	Valfria kurser – ca 45 hp, varav max 15 hp externt valfria (Åk 4–5)
•	Examensarbete – 30 hp på A-nivå (Åk 5)
För studenter antagna:
•	2023 eller tidigare: minst 75 hp på A-nivå
•	2024 eller senare: minst 90 hp på A-nivå
Förtydliganden:
•	Kurser i specialisering betraktas som valfria kurser
•	Max 15 hp får vara externt valfria
•	Endast avslutade kurser med slutbetyg kan ingå i examen”
________________________________________
14. TEKNISKA KRAV
•	HTML, CSS, JavaScript
•	All logik i webbläsaren
•	Ingen backend
•	Koden ska vara:
o	välstrukturerad
o	kommenterad
o	lätt att vidareutveckla
________________________________________
🎯 SLUTMÅL
Ett professionellt, samtalsnära och pedagogiskt digitalt studievägledningsverktyg som:
•	minskar kognitiv belastning
•	visualiserar studietakt
•	stödjer dokumentation
•	stärker kvaliteten i studievägledningssamtal

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://studieplanering.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/2f48950d-1de8-4c86-b5a7-8eb2c2a3e039).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
