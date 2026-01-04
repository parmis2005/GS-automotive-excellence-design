# Server API Documentation

## Overview

Serverseitige API zum Abrufen und Parsen von Fahrzeugdaten von der GS Automobile Rheinland Website.

## Setup

```bash
# Dependencies installieren (bereits im Root installiert)
npm install

# Server starten (Development mit Hot Reload)
npm run dev:server

# Oder Frontend + Server gleichzeitig starten
npm run dev:all
```

## API Endpoints

### GET `/api/vehicles`

Ruft alle verfügbaren Fahrzeuge ab.

**Response:**
```json
{
  "success": true,
  "count": 25,
  "data": [
    {
      "id": "8738290",
      "image": "https://img.cargate360.de/default.aspx?vid=8738290&bid=1790&format=xlrm&ino=1&app=Kiste-Default",
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

Ruft ein einzelnes Fahrzeug anhand der ID ab.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "8738290",
    "image": "https://img.cargate360.de/default.aspx?vid=8738290&bid=1790&format=xlrm&ino=1&app=Kiste-Default",
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

## Caching

- **Cache-Dauer:** 45 Minuten (2700 Sekunden)
- **Typ:** In-Memory Cache (NodeCache)
- **Fallback:** Bei Fehlern wird stale cache zurückgegeben (falls verfügbar)

## Architecture

```
server/
├── index.ts              # Express Server Setup
├── routes/
│   └── vehicles.ts       # API Routes
└── services/
    └── vehicleScraper.ts # HTML Parsing & Scraping Logic
```

## Technologie-Stack

- **Express** - Web Framework
- **Cheerio** - HTML Parsing (jQuery-like)
- **NodeCache** - In-Memory Caching
- **TypeScript** - Type Safety

## Error Handling

- HTTP-Fehler werden abgefangen und als JSON-Response zurückgegeben
- Bei Parsing-Fehlern werden einzelne Fahrzeuge übersprungen (Logging)
- Fallback auf stale cache bei Netzwerkfehlern
