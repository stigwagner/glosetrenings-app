# 📚 Glosetrenings-app

En interaktiv glosetrenings-app for barn som kombinerer kunstig intelligens, visuell læring og gamification for å gjøre engelsktrening engasjerende og effektiv.

## 🎯 Funksjoner

### Kjernefunksjoner
- ✅ **Bildebasert glose-registrering** - Ta bilde av leksesider med OCR
- ✅ **Hangman-stil glosetesting** - Interaktivt ordspill med poengsystem
- ✅ **Setningskonstruksjon** - Lær å bruke ord i kontekst med AI-validering
- ✅ **Uttale-trening** - Stemmegjenkjenning for å øve uttale
- ✅ **Visuell læring** - Automatisk bildesøk for hvert ord
- ✅ **AI-assistert læring** - Claude AI genererer eksempler og validerer svar

### Gamification
- 🏆 **Badges og achievements**
- 🔥 **Streak-system** - Motiverer til daglig trening
- 📊 **Fremdriftsgrafer** - Visualisering av utvikling
- ⭐ **Poengsystem** - 10→6→4→2→1→0 poeng basert på forsøk og hint

### Pedagogiske funksjoner
- 📖 **Ordklasse og grammatikk**
- 🔤 **Synonymer og antonymer**
- 💬 **Eksempelsetninger** fra Claude AI
- 🖼️ **Bilder til hvert ord**
- 📈 **Detaljert statistikk**

## 🛠️ Teknisk stack

### Frontend
- **React** + **TypeScript**
- **Vite** - Moderne build tool
- **PWA** - Progressive Web App (installérbar på mobil/PC)
- **Tesseract.js** - OCR for tekstgjenkjenning
- **Web Speech API** - Stemmegjenkjenning

### Backend
- **Cloudflare Workers** - Serverless backend
- **Cloudflare D1** - SQL-database
- **Claude AI** - Oversettelse og validering
- **Unsplash API** - Bildesøk

## 📦 Installasjon

### Forutsetninger
- Node.js 18+ installert
- Cloudflare-konto (gratis)
- Anthropic API-nøkkel
- Unsplash API-nøkkel (valgfritt)

### Steg 1: Installer pakker

```bash
npm install
```

### Steg 2: Opprett Cloudflare D1 database

```bash
npx wrangler d1 create glosetrenings-db
```

Kopier `database_id` og oppdater `wrangler.toml`.

### Steg 3: Initialiser database

```bash
npx wrangler d1 execute glosetrenings-db --file=./schema.sql
```

### Steg 4: Start utviklingsserver

**Frontend:**
```bash
npm run dev
```

**Backend:**
```bash
npx wrangler dev
```

## 🚀 Deployment

```bash
npm run build
npx wrangler deploy
npx wrangler pages deploy dist
```

---

**Laget med ❤️ for Hermann og Vilma**
# Deployed Sun Jun 14 22:37:14 CEST 2026
