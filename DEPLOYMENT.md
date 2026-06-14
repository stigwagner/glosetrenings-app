# Deployment Guide - Glosetrenings-app

## Deployment til Render.com (GRATIS)

### Steg 1: Opprett GitHub Repository

1. Gå til https://github.com og logg inn
2. Klikk på "New repository"
3. Navn: `glosetrenings-app`
4. Sett til **Private** (siden appen inneholder brukerdata)
5. Klikk "Create repository"

### Steg 2: Push koden til GitHub

Fra WSL/terminal:

```bash
cd /home/swagn/glosetrenings-app

# Initialiser git (hvis ikke allerede gjort)
git init

# Legg til alle filer
git add .

# Commit
git commit -m "Initial commit - nettbasert glosetrenings-app"

# Koble til GitHub (erstatt 'brukernavn' med ditt GitHub-brukernavn)
git remote add origin https://github.com/brukernavn/glosetrenings-app.git

# Push til GitHub
git branch -M main
git push -u origin main
```

### Steg 3: Opprett Render.com konto

1. Gå til https://render.com
2. Klikk "Get Started" og registrer deg (gratis)
3. Koble til din GitHub-konto

### Steg 4: Deploy appen

1. Gå til Render Dashboard
2. Klikk "New +" → "Web Service"
3. Velg ditt `glosetrenings-app` repository
4. Fyll inn:
   - **Name**: `glosetrenings-app` (eller valgfritt navn)
   - **Region**: Frankfurt (nærmest Norge)
   - **Branch**: `main`
   - **Build Command**: `npm install && npm run build:pwa`
   - **Start Command**: `npm start`
   - **Instance Type**: Velg **Free**

5. Klikk "Create Web Service"

### Steg 5: Legg til Anthropic API Key

1. I Render dashboard, gå til din nye service
2. Klikk "Environment" i venstre meny
3. Klikk "Add Environment Variable"
4. Legg til:
   - **Key**: `ANTHROPIC_API_KEY`
   - **Value**: [Din Anthropic API key]
5. Klikk "Save Changes"

Appen vil automatisk redeploye.

### Steg 6: Åpne appen!

Etter 2-3 minutter vil appen være klar på:
```
https://glosetrenings-app.onrender.com
```

(eller det navnet du valgte)

## Viktig informasjon

### Gratis tier begrensninger:
- Serveren går i "søvnmodus" etter 15 minutter uten aktivitet
- Første besøk etter søvnmodus tar 30-60 sekunder
- 750 timer gratis per måned (mer enn nok!)

### Database:
- SQLite database lagres på serveren
- Data beholdes mellom deployments
- Ta backup ved å eksportere fra appen

### Oppdateringer:
Når du gjør endringer:
```bash
git add .
git commit -m "Beskrivelse av endring"
git push
```
Render deployer automatisk når du pusher til GitHub!

## Alternative løsninger

### Railway.app
- Enklere setup
- 500 timer gratis/måned
- https://railway.app

### Vercel (kun frontend)
- Gratis for frontend
- Må bruke separat backend
- https://vercel.com

## Trenger du hjelp?

Render support: https://render.com/docs
