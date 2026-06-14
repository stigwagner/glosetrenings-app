# Glosetrenings-app - Prosjektbeskrivelse

**Til:** Henriette
**Fra:** Stig Berthelsen Wagner
**Dato:** 2026-06-12

## Hva jeg bygger

Jeg holder på å utvikle en **interaktiv glosetrenings-app** for barn - spesielt tilpasset Hermann (2. klasse) og Vilma (4. klasse). Dette er en moderne web-app som kombinerer kunstig intelligens, visuell læring og gamification for å gjøre engelsktrening engasjerende og effektiv.

---

## 🎯 Hovedfunksjonalitet

### 1. **Bildebasert glose-registrering**
- Foreldre/barn tar bilde av leksesider fra skoleboken
- Appen bruker OCR (tekstgjenkjenning) for å lese ordene automatisk
- Glosene lagres organisert etter dato, uke, måned og skoleår

### 2. **Intelligent glosetesting**
- **Hangman-stil spill:** Ordet vises som tomme bokser (_____)
- Poengsystem: 10 poeng ved første forsøk, deretter 6→4→2→1→0
- Gradvis hint-system: Tilfeldig bokstav fylles inn etter hvert forsøk
- Visuelt engasjerende design tilpasset barn

### 3. **Setningskonstruksjon med AI**
- Barnet lager en setning med det engelske ordet
- Claude AI validerer om setningen er grammatisk korrekt
- Gir konstruktiv tilbakemelding og forslag

### 4. **Uttale-trening**
- Stemmegjenkjenning lar barnet si ordet høyt
- AI vurderer uttalen og gir tilbakemelding
- Perfekt for å bygge uttale-selvtillit

---

## 🌟 Avanserte funksjoner

### **Visuell læring**
- Automatisk bildesøk for hvert ord (fra Unsplash/Pexels)
- Barn lærer bedre når de ser bildet av ordet
- Eksempelsetninger på ulike nivåer fra Claude AI
- Ordklasse (substantiv/verb/adjektiv) og grammatikk
- Synonymer og antonymer for å utvide ordforrådet

### **Gamification**
- **Badges/achievements:** "Nybegynner", "3-dagers streak", "Perfeksjonist", etc.
- **Nivåsystem:** Lås opp nye funksjoner etter hvert som de lærer
- **Streak-kalender:** Motiverer til daglig trening
- **Fremgangsindikatorer:** Grafer som viser utviklingen over tid

### **Personlig fremgang**
- Hver bruker (Hermann/Vilma) har sin egen profil
- Synlig fremgang og statistikk
- Vennlig konkurranse mellom søsken (valgfritt)
- Ukentlige og månedlige rapporter

### **Animasjoner og belønninger**
- Confetti ved perfekt score
- Oppmuntrende meldinger
- Lyd-effekter (kan skrus av)

---

## 💻 Teknisk oppbygning

### **Frontend (det brukeren ser)**
- **Progressive Web App (PWA)** - kan installeres på mobil/PC
- Fungerer offline når internett er utilgjengelig
- Moderne og barnevennlig design
- Rask og responsiv

### **Backend (serveren)**
- **Cloudflare Workers** - lynrask server i skyen
- **Cloudflare D1** - SQL-database for lagring av:
  - Brukerprofiler (Hermann/Vilma)
  - Lekser og gloser
  - Testresultater og fremgang
  - Badges og achievements
  - Daglig aktivitet (streaks)

### **AI-integrasjoner**
- **Tesseract.js** - Gratis OCR for tekstgjenkjenning fra bilder
- **Claude AI** - Oversettelse, validering av setninger, generering av øvelser
- **Web Speech API** - Stemmegjenkjenning for uttale-trening

---

## 📊 Pedagogisk verdi

### **Tilpasset læring**
- Barn øver i sitt eget tempo
- Umiddelbar tilbakemelding på feil
- Positiv forsterkning gjennom gamification

### **Multimodal læring**
- **Visuelt:** Bilder og grafikk
- **Auditivt:** Uttale-trening
- **Kinestisk:** Interaktiv skriving/tapping
- **Lesing/skriving:** Setningskonstruksjon

### **Motivasjon og engasjement**
- Streak-system skaper vane
- Badges gir følelse av mestring
- Visuell fremgang viser konkret utvikling

---

## 🚀 Neste steg

1. ✅ Teknisk arkitektur planlagt
2. ✅ Database-skjema designet
3. 🔄 Implementering av kjernefunksjoner (pågår)
4. ⏳ Testing med Hermann og Vilma
5. ⏳ Lansering og vedlikehold

---

## 📱 Bruksscenario

**Typisk bruksflyt:**
1. Hermann logger inn på sin profil
2. Tar bilde av leksesidene fra engelskboken
3. Appen leser automatisk ordene (OCR)
4. Hermann starter glosetesten:
   - Ser et bilde av ordet
   - Gjetter bokstavene (hangman)
   - Får poeng basert på hvor raskt han svarer
5. Lager en setning med ordet
6. Sier ordet høyt for uttale-trening
7. Får confetti ved perfekt score! 🎉
8. Streak-kalenderen oppdateres
9. Låser opp nytt badge: "3-dagers streak" 🔥

---

**Dette blir en pedagogisk kraftpakke som gjør gloselæring gøy!** 🚀📚

Mvh,
Stig
