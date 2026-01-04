# API-Integration Dokumentation

## Übersicht

Diese Anwendung nutzt eine serverseitige API zum Abrufen von Fahrzeugdaten von der GS Automobile Rheinland Website.

## Architektur

```
Frontend (React + Vite)          Backend (Express)
     │                                  │
     │  GET /api/vehicles              │
     ├─────────────────────────────────>│
     │                                  │
     │                                  │  Fetch HTML
     │                                  ├─────────────> GS Auto Website
     │                                  │
     │                                  │  Parse <carzilla-ui-vehicle>
     │                                  │  (Cheerio)
     │                                  │
     │                                  │  Cache (45 Min)
     │                                  │
     │  JSON Response                  │
     │<─────────────────────────────────┤
```

## Installation & Start

### Development (Frontend + Backend)

```bash
# Beide Server gleichzeitig starten
npm run dev:all
```

- Frontend: http://localhost:8080
- Backend API: http://localhost:3001

### Nur Backend Server

```bash
npm run dev:server
```

### Production Build

```bash
# Server bauen
npm run build:server

# Server starten
npm run start:server
```

## API-Verwendung im Frontend

### React Query Hook

```tsx
import { useVehicles } from "@/hooks/useVehicles";

function VehiclesList() {
  const { data: vehicles, isLoading, error } = useVehicles();
  
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return (
    <div>
      {vehicles?.map(vehicle => (
        <div key={vehicle.id}>{vehicle.brand} {vehicle.model}</div>
      ))}
    </div>
  );
}
```

### Direkte API-Aufrufe

```tsx
import { fetchVehicles, fetchVehicleById } from "@/lib/api/vehicles";

// Alle Fahrzeuge
const vehicles = await fetchVehicles();

// Einzelnes Fahrzeug
const vehicle = await fetchVehicleById("8738290");
```

## JSON-Response Format

### GET /api/vehicles

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

### GET /api/vehicles/:id

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

- **Dauer:** 45 Minuten (2700 Sekunden)
- **Typ:** In-Memory Cache (NodeCache)
- **Vorteile:**
  - Reduzierte Last auf GS Auto Website
  - Schnellere Response-Zeiten
  - Fallback bei Fehlern (stale cache)

## Scraping-Logik

Die API parst die HTML-Seite und extrahiert `<carzilla-ui-vehicle>` Custom Elements:

```html
<carzilla-ui-vehicle
  vehicle-id="8738290"
  vehicle-title="BMW i4 eDrive40 GC M-SPORT-PRO"
  vehicle-price="52500"
  vehicle-image-url="..."
  offer-url="..."
  branch-id="1790"
/>
```

## Features

✅ Serverseitiges Scraping (kein Browser-Scraping)  
✅ Caching (45 Min TTL)  
✅ Fehlerbehandlung & Fallback  
✅ TypeScript Type Safety  
✅ React Query Integration  
✅ SEO-freundlich (Server-Side)  
✅ Production-ready Code  

## Troubleshooting

### Server startet nicht

- Port 3001 bereits belegt? → Ändere PORT in `.env`
- Dependencies installiert? → `npm install`

### Keine Fahrzeuge werden geladen

- Backend läuft? → `npm run dev:server`
- CORS-Fehler? → Proxy konfiguriert in `vite.config.ts`
- HTML-Struktur geändert? → Prüfe `server/services/vehicleScraper.ts`

### Cache-Probleme

- Cache zurücksetzen: Server neu starten
- Cache-Dauer anpassen: `server/services/vehicleScraper.ts` (stdTTL)
