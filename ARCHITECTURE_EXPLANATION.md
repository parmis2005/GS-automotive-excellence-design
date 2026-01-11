# Neue Architektur - Erklärung

## Was hat sich geändert?

### VORHER (Alte Architektur):
```
Frontend → API → Scraper → Cargate/GS Auto Website (jeder Request = 1-2 Min Wartezeit)
         ↓
      NodeCache (In-Memory, geht bei Server-Restart verloren)
```

### JETZT (Neue Architektur):
```
Background-Job (alle 30 Min) → Scraper → Cargate/GS Auto Website → PostgreSQL Datenbank
                                                      ↓
Frontend → API → PostgreSQL Datenbank (sofortige Antwort, < 50ms)
```

## Datenfluss

### 1. Background-Sync (alle 30 Minuten)
- **Wer:** `server/services/syncService.ts`
- **Was:** Holt alle Fahrzeugdaten von GS Auto Website (Cargate)
- **Wohin:** Speichert alle Daten in PostgreSQL Datenbank
- **Wann:** Automatisch alle 30 Minuten + beim Server-Start

### 2. Frontend → API → Datenbank
- **Wer:** `server/routes/vehicles.ts`
- **Was:** Liest Fahrzeugdaten aus PostgreSQL
- **Performance:** Sehr schnell (< 50ms)
- **Wartezeit:** KEINE - Daten sind bereits in der Datenbank

## Was wird gespeichert?

### ✅ In der Datenbank (PostgreSQL):
- **Fahrzeug-Metadaten:** ID, Marke, Modell, Preis, Jahr, Kilometerstand, etc.
- **Bild-URLs:** Die URL zu den Cargate-Bildern wird gespeichert
- **Alle Fahrzeug-Details:** Kraftstoff, Getriebe, Farbe, Ausstattung, etc.

### ❌ NICHT in der Datenbank:
- **Bilder selbst:** Bilder werden NICHT gespeichert (zu groß, ~MB pro Bild)
- **Nur die URLs:** Die URLs zu `https://img.cargate360.de/...` werden gespeichert

## Bilder - Wie funktioniert das?

### Bilder werden NICHT in der Datenbank gespeichert!
- **Nur URLs werden gespeichert:** z.B. `https://img.cargate360.de/default.aspx?vid=8738290&bid=1790&format=xl&ino=1`
- **Bilder werden direkt von Cargate geladen:** Browser lädt Bilder direkt von `img.cargate360.de`
- **Warum?** Bilder sind sehr groß (mehrere MB pro Bild) - würde Datenbank aufblähen

### Datenfluss für Bilder:
```
1. Background-Job: Speichert Bild-URL in Datenbank
   → Beispiel: "https://img.cargate360.de/default.aspx?vid=8738290&bid=1790&format=xl&ino=1"

2. Frontend: Bekommt Bild-URL aus API
   → API liefert: { image: "https://img.cargate360.de/..." }

3. Browser: Lädt Bild direkt von Cargate
   → <img src="https://img.cargate360.de/..." />
```

## Direkte Cargate-Verbindungen

### ✅ Noch vorhanden (für Bilder):
- **Bilder werden direkt von Cargate geladen** (`img.cargate360.de`)
- **Warum?** Bilder sind zu groß für Datenbank, URLs werden gespeichert
- **Auswirkung:** Wenn Cargate-Bilder ausfallen, werden Bilder nicht angezeigt (aber Daten bleiben)

### ❌ Nicht mehr vorhanden:
- **Keine direkten Daten-Abfragen mehr** - alle Metadaten kommen aus Datenbank
- **Keine Wartezeit mehr** - API antwortet sofort aus Datenbank

## Vorteile der neuen Architektur

✅ **Sofortige Ladezeiten:** Keine 1-2 Minuten Wartezeit mehr  
✅ **Robustheit:** Website läuft auch wenn Cargate/GS Auto Website ausfällt  
✅ **Persistente Speicherung:** Daten überleben Server-Restarts  
✅ **Skalierbarkeit:** Mehrere Server-Instanzen können die gleiche Datenbank nutzen  
✅ **Performance:** Datenbank-Queries sind sehr schnell (< 50ms)  

## Zusammenfassung

| Aspekt | Vorher | Jetzt |
|--------|--------|-------|
| **Datenquelle (User-Request)** | Direkt von Cargate | Aus PostgreSQL |
| **Wartezeit** | 1-2 Minuten | < 50ms |
| **Bilder** | Direkt von Cargate | Direkt von Cargate (URLs in DB) |
| **Speicherung** | In-Memory Cache | PostgreSQL Datenbank |
| **Robustheit** | Fällt aus wenn Cargate down | Läuft weiter mit alten Daten |
| **Background-Job** | Nein | Ja, alle 30 Min |
