# 📱 Installasjon på Samsung Pad

Glosetrenings-appen er nå klar som **Progressive Web App (PWA)** og kan installeres direkte på Samsung-pad uten Play Store.

## ✨ Hva er en PWA?

En PWA fungerer som en vanlig app:
- ✅ Eget app-ikon på hjemskjermen
- ✅ Fungerer offline (med service worker caching)
- ✅ Fullskjerm (ingen nettleser-UI)
- ✅ Rask lasting og native følelse
- ✅ Ingen app store nødvendig

## 📋 Forutsetninger

1. **Webserver** - Appen må hostes på en server (ikke localhost)
2. **HTTPS** - PWA krever sikker tilkobling (unntatt localhost for testing)
3. **Samsung Internet eller Chrome** - Anbefalt nettleser

## 🚀 Installasjonstrinn

### 1. Host appen

**Alternativ A: Lokal nettverk (testing)**
```bash
# Start backend
node server.js

# Serve frontend med riktig backend-URL
npm run preview
```

**Alternativ B: Produksjon (anbefalt)**
- Host `dist/` mappen på en webserver (Netlify, Vercel, egen server)
- Sørg for HTTPS
- Backend må være tilgjengelig på riktig URL

### 2. Åpne appen på Samsung-paden

1. Åpne **Samsung Internet** eller **Chrome**
2. Naviger til appens URL (f.eks. `https://din-server.no`)
3. Vent til siden laster

### 3. Installer på hjemskjermen

**I Samsung Internet:**
1. Trykk på **☰** menyen (nederst til høyre)
2. Velg **"Legg til på Hjem-skjerm"** eller **"Installer app"**
3. Gi appen et navn (f.eks. "Gloser")
4. Trykk **"Legg til"**

**I Chrome:**
1. Trykk på **⋮** menyen (øverst til høyre)
2. Velg **"Legg til på startskjermen"** eller **"Installer app"**
3. Bekreft installasjonen

### 4. Bruk appen

- Finn app-ikonet på hjemskjermen (lilla gradient med "G")
- Åpne appen - den starter i fullskjerm
- Første gang appen åpnes, lastes alle ressurser ned for offline-bruk

## 🔧 Tekniske detaljer

### Service Worker

Appen bruker Workbox for caching:
- **App Shell** - Alle HTML/CSS/JS filer cachet
- **API calls** - NetworkFirst strategi (prøver nettverk først, fallback til cache)
- **Bilder** - CacheFirst strategi (rask lasting)
- **Offline support** - Grunnleggende funksjonalitet fungerer uten internett

### Manifest.json

PWA-manifest konfigurert for:
- Norsk språk (`lang: "no"`)
- Standalone display mode (fullskjerm)
- Portrait orientation
- Theme color: #667eea (lilla)
- Ikoner: 192x192, 512x512, 1024x1024

## 📦 Deployment-oppsett

### Backend (server.js)

Backend må være tilgjengelig på en offentlig URL eller samme nettverk som Samsung-paden:

```bash
# Produksjon
node server.js

# Med PM2 (anbefalt for server)
pm2 start server.js --name glosetrenings-backend
```

### Frontend (dist/)

Frontend kan hostes på:

**1. Static hosting (Netlify/Vercel):**
```bash
# Deploy til Netlify
npm run build:pwa
netlify deploy --prod --dir=dist
```

**2. Egen webserver (Nginx):**
```nginx
server {
    listen 443 ssl;
    server_name din-server.no;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    root /path/to/glosetrenings-app/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**3. Express static server:**
```javascript
import express from 'express';
const app = express();
app.use(express.static('dist'));
app.listen(3000);
```

## 🔄 Oppdateringer

Når du oppdaterer appen:

1. Bygg ny versjon:
```bash
npm run build:pwa
```

2. Deploy nye filer

3. PWA oppdaterer automatisk (via service worker)
   - Brukere får ny versjon neste gang de åpner appen
   - Vite-PWA sørger for auto-update

## 🐛 Feilsøking

### "Kan ikke installere app"
- Sjekk at HTTPS er aktivert (eller localhost for testing)
- Sjekk at manifest.json lastes riktig (DevTools → Application → Manifest)
- Prøv å cleare cache og reload

### "Service worker registreres ikke"
- Sjekk console for feilmeldinger
- Verifiser at sw.js finnes i dist/
- HTTPS må være aktivert

### "Offline fungerer ikke"
- Service worker må registreres først (åpne appen online)
- Sjekk DevTools → Application → Service Workers
- Cache Strategy er NetworkFirst for API (prøver online først)

## 🎯 Neste steg: Native Android App (valgfritt)

Hvis du ønsker en ekte Android .apk fil for Play Store:

### Capacitor-tilnærming

```bash
# Installer Capacitor
npm install @capacitor/core @capacitor/cli @capacitor/android

# Initialiser
npx cap init

# Legg til Android
npx cap add android

# Bygg og synkroniser
npm run build:pwa
npx cap sync

# Åpne i Android Studio
npx cap open android
```

Dette gir deg en native .apk fil som kan:
- Publiseres på Google Play Store
- Installeres direkte via .apk fil
- Har tilgang til native Android API-er (kamera, mikrofon, etc.)

## 📊 Sammenligning: PWA vs Native App

| Feature | PWA | Native App |
|---------|-----|------------|
| Installasjon | Direkte fra nettleser | .apk eller Play Store |
| Oppdateringer | Automatisk | Manual download |
| Størrelse | ~1-2 MB | ~10-50 MB |
| Offline | ✅ (begrenset) | ✅ (full) |
| Native API-er | ⚠️ (begrenset) | ✅ (full tilgang) |
| Utviklingstid | ✅ Raskt | ⏱️ Mer arbeid |
| Distribution | Direkte URL | App Store |

## 💡 Anbefalinger

For Samsung-pad i familien:
1. **Start med PWA** - Raskest å komme i gang
2. **Test grundig** - Sjekk at offline fungerer
3. **Vurder native app senere** - Hvis du trenger mer funksjonalitet

## 🔗 Nyttige lenker

- [PWA Developer Guide](https://web.dev/progressive-web-apps/)
- [Vite PWA Plugin](https://vite-pwa-org.netlify.app/)
- [Capacitor Docs](https://capacitorjs.com/)
