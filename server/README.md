# Server API Documentation

## Overview

Serverseitige API zum Abrufen und Parsen von Fahrzeugdaten von der GS Automobile Rheinland Website.

**Neue Architektur (seit PostgreSQL-Integration):**
- Daten werden in PostgreSQL-Datenbank gespeichert
- Background-Job aktualisiert Daten alle 30 Minuten (konfigurierbar)
- Website läuft auch wenn Cargate/GS Auto Website ausfällt (verwendet letzte gespeicherte Daten)
- Sofortige Antwortzeiten - keine Wartezeit beim Laden der Website

## Setup

### 1. Environment Variables

Erstelle eine `.env` Datei im Server-Verzeichnis oder setze die folgenden Environment-Variablen:

```bash
# PostgreSQL Connection String (REQUIRED)
DATABASE_URL=postgresql://user:password@host/database?sslmode=require

# Sync Interval in Minuten (optional, default: 30)
SYNC_INTERVAL_MINUTES=30

# Server Port (optional, default: 3001)
PORT=3001

# --- CarGate Carzilla V6 API (empfohlen für Bestandsdaten) ---
# Wenn gesetzt, werden Fahrzeuge über die offizielle API geladen statt per Website-Scraping.
# Basis-URL und ggf. Endpunkt-Namen bitte aus der Schnittstellenbeschreibung (Carzilla V6 PDF) übernehmen.
# CARGATE_API_KEY=<Ihr API-Key von CarGate>
# CARGATE_API_BASE_URL=<laut PDF, z.B. https://api.cargate360.de/v6>
# CARGATE_VEHICLES_PATH=vehicles   # optional, Endpunkt-Name laut PDF (Default: vehicles)
# CARGATE_BRANCH_ID=1790
```

**CarGate API aktivieren:** In der `.env` (im Projektroot) `CARGATE_API_KEY` und `CARGATE_API_BASE_URL` setzen (Basis-URL aus der Carzilla V6 Schnittstellenbeschreibung). Anschließend Server neu starten.

**Wichtig:** Der `DATABASE_URL` sollte NIEMALS im Code hardcoded werden. Verwende immer Environment-Variablen!

### 2. Datenbank Setup

Die Datenbank wird automatisch initialisiert, wenn der Server startet. Die Tabellen werden automatisch erstellt, falls sie nicht existieren.

### 3. Dependencies installieren

```bash
npm install
```

### 4. Server starten

```bash
# Development mit Hot Reload
npm run dev:server

# Oder Frontend + Server gleichzeitig
npm run dev:all

# Production Build
npm run build:server
npm run start:server
```

## Architecture

```
server/
├── index.ts                 # Express Server Setup
├── db/
│   ├── database.ts          # Database Connection & CRUD Operations
│   └── schema.sql           # Database Schema (for reference)
├── routes/
│   └── vehicles.ts          # API Routes (read from database)
└── services/
    ├── cargateApi.ts        # CarGate Carzilla V6 API (wenn API-Key gesetzt)
    ├── vehicleScraper.ts    # HTML Parsing & Scraping (Fallback)
    └── syncService.ts       # Background Job für regelmäßige Updates
```

## API Endpoints

### GET `/api/vehicles`

Ruft alle verfügbaren Fahrzeuge aus der Datenbank ab.

**Response:**
```json
{
  "success": true,
  "count": 25,
  "data": [
    {
      "id": "8738290",
      "image": "https://img.cargate360.de/...",
      "brand": "BMW",
      "model": "i4 eDrive40 GC M-SPORT-PRO",
      "price": 52500,
      "year": 2025,
      "mileage": 0,
      "fuel": "Elektro",
      "transmission": "Automatik",
      "isNew": true
    }
  ],
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### GET `/api/vehicles/:id`

Ruft ein einzelnes Fahrzeug anhand der ID aus der Datenbank ab.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "8738290",
    "image": "https://img.cargate360.de/...",
    "brand": "BMW",
    "model": "i4 eDrive40 GC M-SPORT-PRO",
    "price": 52500,
    "year": 2025,
    "mileage": 0,
    "fuel": "Elektro",
    "transmission": "Automatik",
    "isNew": true
  }
}
```

## Datenquelle: CarGate API vs. Scraper

- **CarGate Carzilla V6 API (empfohlen):** Wenn `CARGATE_API_KEY` und `CARGATE_API_BASE_URL` gesetzt sind:
  - **Fahrzeuge kommen direkt von der API** (mit Cache, keine Datenbank nötig).
  - Standtage/Zugangsdatum werden von der API gemappt und angezeigt.
  - **DATABASE_URL ist dann optional** – Server startet ohne PostgreSQL.
- **Ohne API:** Dann sind `DATABASE_URL` und Sync-Job nötig; Daten kommen aus dem Website-Scraper (kein Zugangsdatum/Standtage im Scraper).

## Background Sync Job

Der Background-Job:
- Startet automatisch beim Server-Start
- Aktualisiert Daten alle 30 Minuten (konfigurierbar via `SYNC_INTERVAL_MINUTES`)
- Führt einen ersten Sync sofort beim Start aus
- Bei Fehlern: Alte Daten bleiben in der Datenbank (Website läuft weiter)

**Wichtig:** Wenn Cargate/GS Auto Website ausfällt, bleiben die letzten gespeicherten Daten in der Datenbank und die Website funktioniert weiterhin normal.

## Caching & Performance

- **Kein in-memory Cache mehr** - alle Daten kommen aus PostgreSQL
- **Sofortige Antwortzeiten** - Datenbank-Queries sind sehr schnell (< 50ms)
- **Persistente Speicherung** - Daten überleben Server-Restarts
- **Skalierbar** - mehrere Server-Instanzen können die gleiche Datenbank nutzen

## Technologie-Stack

- **Express** - Web Framework
- **PostgreSQL** - Datenbank (via `pg` package)
- **Cheerio** - HTML Parsing (für Scraping)
- **TypeScript** - Type Safety

## Security

⚠️ **WICHTIG:**
- `DATABASE_URL` enthält sensible Credentials - NIEMALS im Code committen!
- Verwende Environment-Variablen oder einen Secrets-Manager
- In Production: Verwende SSL/TLS für Datenbank-Verbindungen (Neon unterstützt das standardmäßig)

## Error Handling

- Bei Datenbank-Fehlern: API gibt leeres Array zurück (Frontend zeigt "keine Fahrzeuge" an)
- Bei Scraping-Fehlern: Alte Daten bleiben in der Datenbank
- Bei Connection-Problemen: Server startet nicht (verhindert Fehler zur Laufzeit)
