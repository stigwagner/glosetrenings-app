# 🚀 Hurtigstart - Glosetrenings-app

Kom i gang på 5 minutter!

## 📋 Sjekkliste før du starter

- [ ] Node.js 18+ installert
- [ ] Cloudflare-konto opprettet (https://dash.cloudflare.com/sign-up)
- [ ] Anthropic API-nøkkel (https://console.anthropic.com/account/keys)

## ⚡ Rask oppsett (lokal utvikling)

### 1. Installer pakker

```bash
cd glosetrenings-app
npm install
```

### 2. Opprett Cloudflare D1 database

```bash
# Opprett database
npx wrangler d1 create glosetrenings-db

# Du får output som ser slik ut:
# [[d1_databases]]
# binding = "DB"
# database_name = "glosetrenings-db"
# database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

### 3. Oppdater `wrangler.toml`

Kopier `database_id` fra steget over og lim inn i `wrangler.toml`:

```toml
[[d1_databases]]
binding = "DB"
database_name = "glosetrenings-db"
database_id = "DIN-ID-HER"  # <-- Endre denne
```

### 4. Initialiser database

```bash
npx wrangler d1 execute glosetrenings-db --file=./schema.sql
```

### 5. Opprett testbrukere

```bash
npx wrangler d1 execute glosetrenings-db --command="
INSERT INTO users (username, password_hash, display_name, birth_year, grade)
VALUES
  ('hermann', '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8', 'Hermann', 2018, 2),
  ('vilma', '5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8', 'Vilma', 2016, 4);
"
```

> **Passord:** `password` (du bør endre dette senere!)

### 6. Legg til API-nøkler

Opprett `.dev.vars` fil i prosjektmappen:

```bash
ANTHROPIC_API_KEY=sk-ant-api-xxxxx
UNSPLASH_ACCESS_KEY=your-unsplash-key-her
```

> **Obs:** `.dev.vars` er allerede i `.gitignore` og blir ikke committed til Git

### 7. Start appen!

Åpne **to terminaler**:

**Terminal 1 (Frontend):**
```bash
npm run dev
```

**Terminal 2 (Backend):**
```bash
npx wrangler dev
```

### 8. Åpne appen

Gå til: http://localhost:5173

**Logg inn med:**
- Brukernavn: `hermann` eller `vilma`
- Passord: `password`

## ✅ Test at alt fungerer

1. **Logg inn** med hermann/password
2. **Opprett ny leksjon** - Trykk "Ny leksjon"
3. **Legg til et ord** manuelt (f.eks. "apple")
4. **Start glosetesten**
5. **Gjett ordet** - Se at poengsystemet fungerer

## 🐛 Hvis noe går galt

### Database finnes ikke
```bash
npx wrangler d1 list
# Sjekk at "glosetrenings-db" er i listen
```

### API-nøkkel virker ikke
```bash
# Test at .dev.vars er lest inn
npx wrangler dev
# Se etter output som bekrefter at variabler er lastet
```

### Kan ikke koble til backend
- Sjekk at både frontend og backend kjører
- Frontend: http://localhost:5173
- Backend: http://localhost:8787

### OCR fungerer ikke
- Tesseract.js lastes første gang du bruker det (kan ta tid)
- Prøv med et bilde som har tydelig tekst

## 🔐 Endre passord

For å endre passord, generer en ny SHA-256 hash:

```bash
# I Node.js eller Chrome DevTools:
const password = "ditt-nye-passord";
const hash = Array.from(new Uint8Array(
  await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(password)
  )
)).map(b => b.toString(16).padStart(2, '0')).join('');
console.log(hash);
```

Deretter oppdater i database:

```bash
npx wrangler d1 execute glosetrenings-db --command="
UPDATE users SET password_hash = 'DIN-HASH-HER' WHERE username = 'hermann';
"
```

## 📦 Deploy til produksjon

### 1. Legg til secrets

```bash
npx wrangler secret put ANTHROPIC_API_KEY
# Lim inn API-nøkkelen når du blir spurt

npx wrangler secret put UNSPLASH_ACCESS_KEY
# Lim inn Unsplash-nøkkelen
```

### 2. Deploy backend

```bash
npx wrangler deploy
```

### 3. Bygg og deploy frontend

```bash
npm run build
npx wrangler pages deploy dist
```

### 4. Oppdater CORS

I `src/worker/index.ts`, endre CORS til produksjons-URL:

```typescript
const corsHeaders = {
  'Access-Control-Allow-Origin': 'https://din-app.pages.dev',
  // ...
};
```

## 🎉 Du er klar!

Nå kan Hermann og Vilma begynne å øve på gloser! 📚

---

**Trenger du hjelp?** Se full dokumentasjon i `README.md`
