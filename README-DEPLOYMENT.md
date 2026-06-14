# 🚀 Deploy Glosetrenings-app til nett

Appen er klar for deployment! Følg denne korte guiden for å få appen online **24/7 gratis**.

## ✅ Hva er gjort?

Jeg har konfigurert appen for cloud deployment:

1. ✅ Production server som serverer både frontend og backend
2. ✅ Environment variable support
3. ✅ PWA bygget og klar
4. ✅ Database persistence
5. ✅ Render.com deployment config
6. ✅ Hopp over-knapper i alle øvelser

## 🎯 Rask start (5 minutter)

### 1. Push til GitHub

```bash
cd /home/swagn/glosetrenings-app

# Initialiser git
git init
git add .
git commit -m "Klar for deployment"

# Push til GitHub (erstatt 'ditt-brukernavn' med ditt GitHub-brukernavn)
git remote add origin https://github.com/ditt-brukernavn/glosetrenings-app.git
git branch -M main
git push -u origin main
```

### 2. Deploy til Render.com

1. Gå til https://render.com og registrer deg (GRATIS)
2. Koble til GitHub
3. Klikk "New +" → "Web Service"
4. Velg `glosetrenings-app` repository
5. Settings:
   - **Build Command**: `npm install && npm run build:pwa`
   - **Start Command**: `npm start`
   - **Instance Type**: Free
6. Legg til environment variable:
   - **Key**: `ANTHROPIC_API_KEY`
   - **Value**: [Din Anthropic API key]
7. Klikk "Create Web Service"

**Ferdig!** Appen vil være live på `https://glosetrenings-app.onrender.com` (eller ditt valgte navn) om 2-3 minutter.

## 📖 Full guide

Se [DEPLOYMENT.md](./DEPLOYMENT.md) for detaljert veiledning.

## 🎨 Hva appen kan nå:

- ✅ Tilgjengelig 24/7 fra hvor som helst
- ✅ Fungerer på Samsung pad, mobil, PC
- ✅ Offline-støtte (PWA)
- ✅ Hopp over øvelser du ikke vil gjøre
- ✅ Automatisk backup i skyen
- ✅ Auto-deploy når du pusher til GitHub

## 💡 Tips

**Gratis tier**: Serveren "sover" etter 15 min inaktivitet. Første besøk etter søvn tar 30-60 sek.

**Oppdateringer**: Bare push til GitHub:
```bash
git add .
git commit -m "Min endring"
git push
```

Render deployer automatisk!

## 🆘 Trenger hjelp?

Se [DEPLOYMENT.md](./DEPLOYMENT.md) eller kontakt support:
- Render: https://render.com/docs
- GitHub: https://docs.github.com
