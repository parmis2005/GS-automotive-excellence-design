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
```

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
    ├── vehicleScraper.ts    # HTML Parsing & Scraping Logic
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
