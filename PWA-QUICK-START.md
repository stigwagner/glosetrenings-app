# ⚡ PWA Quick Start - Samsung Pad

## 🎯 Hurtigguide (5 minutter)

### 1. Bygg PWA
```bash
npm run build:pwa
```

### 2. Start serverne

**Terminal 1 - Backend:**
```bash
node server.js
```

**Terminal 2 - Frontend:**
```bash
npm run preview
```

Appen kjører nå på: `http://localhost:4173`

### 3. Test PWA lokalt

1. Åpne Chrome/Edge på PC
2. Gå til `http://localhost:4173`
3. DevTools → Application → Service Workers
4. Verifiser at service worker er aktivert

### 4. Installer på Samsung-pad

**På samme nettverk:**

1. Finn PC-ens IP-adresse:
   ```bash
   ip addr show | grep inet
   # Eller på Windows: ipconfig
   ```

2. På Samsung-paden:
   - Åpne Samsung Internet / Chrome
   - Gå til `http://[DIN-PC-IP]:4173`
   - Trykk **☰** → **"Legg til på Hjem-skjerm"**
   - Ferdig! App-ikon ligger nå på hjemskjermen

## 📦 Produksjons-deployment

### Alternativ 1: Netlify (gratis, enklest)

```bash
# Installer Netlify CLI
npm install -g netlify-cli

# Deploy
netlify deploy --prod --dir=dist
```

Du får en URL: `https://[app-navn].netlify.app`

**Viktig:** Backend må hostes separat (f.eks. Railway, Render)

### Alternativ 2: Vercel (gratis)

```bash
# Installer Vercel CLI
npm install -g vercel

# Deploy
cd dist && vercel --prod
```

### Alternativ 3: Egen server (full kontroll)

```bash
# Kopier dist-mappen til server
scp -r dist/* bruker@server:/var/www/gloser/

# Konfigurer Nginx (se INSTALLASJON-SAMSUNG-PAD.md)
```

## 🔄 Daglig bruk

### Oppdatere appen

```bash
# 1. Gjør endringer i koden
# 2. Bygg på nytt
npm run build:pwa

# 3. Deploy (avhenger av hosting)
netlify deploy --prod --dir=dist
# eller bare restart preview-serveren for lokal testing
```

PWA oppdaterer automatisk for brukerne (kan ta noen minutter).

## ✅ Sjekkliste for produksjon

- [ ] Backend hostet og tilgjengelig
- [ ] Frontend bygget: `npm run build:pwa`
- [ ] HTTPS aktivert (PWA-krav)
- [ ] Manifest.json lastes riktig
- [ ] Service worker registreres
- [ ] Ikoner vises korrekt
- [ ] Offline-mode fungerer
- [ ] Testet på Samsung-pad

## 🐛 Vanlige problemer

### "Installation not available"
→ Krever HTTPS (eller localhost)

### "Service worker failed to register"
→ Sjekk console: DevTools → Console

### "Backend API errors"
→ Sjekk at proxy-konfigurasjonen i `vite.config.ts` peker til riktig backend-URL

## 📱 App-informasjon

- **Navn:** Glosetrenings-app
- **Kort navn:** Gloser
- **Ikon:** Lilla gradient med "G"
- **Theme color:** #667eea
- **Størrelser:** 192x192, 512x512, 1024x1024

## 🎨 Tilpass appen

### Endre ikon-design

Rediger `generate-icons.js`:
```javascript
// Endre farger, bokstav, etc.
const createIconSVG = (size) => `...`
```

Kjør:
```bash
node generate-icons.js
npm run build:pwa
```

### Endre app-navn

Rediger `public/manifest.json`:
```json
{
  "name": "Ditt Nye Navn",
  "short_name": "Kort Navn"
}
```

### Endre theme color

Rediger `public/manifest.json` og `index.html`:
```json
"theme_color": "#din-farge"
```

## 📊 Fil-oversikt

```
glosetrenings-app/
├── dist/                    # Bygget PWA (deploy denne)
│   ├── index.html
│   ├── manifest.json
│   ├── sw.js               # Service worker
│   ├── icon-*.png          # App-ikoner
│   └── assets/
├── public/
│   ├── manifest.json       # PWA-konfigurasjon
│   └── icon-*.png
├── vite.config.ts          # PWA-oppsett
└── generate-icons.js       # Ikon-generator
```

## 🚀 Neste steg

1. **Test lokalt** - Verifiser at alt fungerer
2. **Deploy til produksjon** - Velg hosting-løsning
3. **Installer på Samsung-pad** - Test installasjon
4. **Del URL** - La familie teste appen

---

**Trenger mer hjelp?** Les detaljert guide: `INSTALLASJON-SAMSUNG-PAD.md`
