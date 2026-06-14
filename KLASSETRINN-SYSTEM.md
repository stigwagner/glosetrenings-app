# Klassetrinn-system med automatisk oppdatering

## Problem
Hvordan håndtere klassetrinn når det er 25. juli (mellom to skoleår)?

## Løsning
Systemet lagrer **året barnet startet 1. klasse** og beregner klassetrinn dynamisk basert på dagens dato.

## Database-struktur

### `users` tabell:
- `birth_year` - fødselsår
- `school_start_year` - året barnet startet 1. klasse (f.eks. 2023)
- `grade` - nåværende klassetrinn (oppdateres automatisk ved innlogging)

## Beregningslogikk

### Skoleår i Norge:
- Starter: ~15. august
- Slutter: ~15. juni

### Sommerregel (15. juni - 14. august):
**Eleven regnes som i NESTE klassetrinn**

Dette gjør at ordbanken kan tilpasses høstens nivå allerede i sommerferien.

### Eksempel: Hermann (startet skolen 2024)

| Dato | Klassetrinn | Skoleår | Sommerferie |
|------|-------------|---------|-------------|
| 15. jan 2026 | 2. klasse | 2025/2026 | Nei |
| 14. juni 2026 | 2. klasse | 2025/2026 | Nei |
| **20. juni 2026** | **3. klasse** | 2025/2026 | **Ja** 🏖️ |
| 15. juli 2026 | 3. klasse | 2025/2026 | Ja 🏖️ |
| 10. aug 2026 | 3. klasse | 2026/2027 | Ja 🏖️ |
| **20. aug 2026** | **3. klasse** | 2026/2027 | **Nei** |
| 15. sep 2026 | 3. klasse | 2026/2027 | Nei |

## Implementasjon

### 1. Grade Calculator (`grade-calculator.js`)
```javascript
calculateCurrentGrade(schoolStartYear, currentDate)
```
- Beregner hvilket skoleår vi er i
- Legger til +1 hvis sommerferie
- Returnerer klassetrinn (1-7)

### 2. Login-logikk (`server.js`)
Ved innlogging:
1. Henter `school_start_year` fra database
2. Beregner nåværende klassetrinn med `calculateCurrentGrade()`
3. Oppdaterer `grade` i databasen
4. Returnerer oppdatert klassetrinn til klient

### 3. Priority-system for ord
```sql
WHERE w.recommended_grade <= ?
```
Bruker det dynamisk beregnede klassetrinnet for å filtrere universelle ord.

## Fordeler

✅ **Automatisk oppdatering** - Ingen manuell endring nødvendig
✅ **Historisk presisjon** - Alltid riktig klassetrinn basert på dato
✅ **Sommerklarhet** - Tydelig regel for sommerferie
✅ **Fremtidsrettet** - Fungerer automatisk år etter år

## Testing

Kjør:
```bash
node grade-calculator.js        # Test grunnleggende logikk
node test-grade-through-year.js # Test Hermann og Vilma gjennom året
```

## Migrering

For eksisterende brukere:
```bash
node add-school-year-tracking.js
```

Dette beregner `school_start_year` basert på nåværende `grade`.
