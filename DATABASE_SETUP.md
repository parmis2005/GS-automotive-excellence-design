# PostgreSQL Datenbank Setup

## Übersicht

Die Website verwendet jetzt PostgreSQL statt In-Memory Cache für die Fahrzeugdaten. Dies bietet:

✅ **Sofortige Ladezeiten** - Keine 1-2 Minuten Wartezeit mehr  
✅ **Robustheit** - Website läuft auch wenn Cargate/GS Auto Website ausfällt  
✅ **Persistente Speicherung** - Daten überleben Server-Restarts  
✅ **Skalierbarkeit** - Mehrere Server-Instanzen können die gleiche Datenbank nutzen

## Setup

### 1. Environment Variable setzen

Setze die `DATABASE_URL` Environment-Variable mit deinem Neon Connection String:

**WICHTIG:** Der Connection String enthält sensible Credentials - NIEMALS im Code committen!

#### Option A: Lokal (Development)
```bash
# Erstelle eine .env Datei im Root-Verzeichnis
DATABASE_URL=postgresql://neondb_owner:npg_NFU7JQh8VaWY@ep-purple-art-agfdqgns-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require
```

#### Option B: Production (z.B. Vercel)
In den Vercel Environment Variables:
- Key: `DATABASE_URL`
- Value: `postgresql://neondb_owner:npg_NFU7JQh8VaWY@ep-purple-art-agfdqgns-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require`

#### Option C: Shell/Command Line
```bash
export DATABASE_URL="postgresql://neondb_owner:npg_NFU7JQh8VaWY@ep-purple-art-agfdqgns-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
```

### 2. Optional: Sync-Intervall anpassen

Standard: 30 Minuten

```bash
SYNC_INTERVAL_MINUTES=30  # oder 15, 60, etc.
```

### 3. Server starten

```bash
npm run dev:server
```

Die Datenbank wird automatisch initialisiert (Tabellen werden erstellt, falls sie nicht existieren).

## Wie es funktioniert

1. **Server-Start:**
   - Verbindet zur PostgreSQL-Datenbank
   - Erstellt Tabellen (falls nicht vorhanden)
   - Startet Background-Job
   - Führt ersten Sync sofort aus

2. **Background-Job (alle 30 Min):**
   - Holt Daten von GS Auto Website
   - Aktualisiert Datenbank
   - Bei Fehlern: Alte Daten bleiben in DB (Website läuft weiter)

3. **API-Requests:**
   - Lesen direkt aus Datenbank
   - Sehr schnell (< 50ms)
   - Keine Wartezeit für User

## Sicherheit

⚠️ **WICHTIG:**
- Connection String NIEMALS im Code hardcoden
- NIEMALS in Git committen
- In Production: Verwende Environment Variables oder Secrets Manager
- Neon verwendet standardmäßig SSL/TLS

## Troubleshooting

### "DATABASE_URL environment variable is not set"
→ Setze die Environment-Variable (siehe oben)

### "Connection refused" oder "Connection timeout"
→ Prüfe Connection String
→ Prüfe ob Neon-Datenbank läuft
→ Prüfe Firewall/Netzwerk

### "relation 'vehicles' does not exist"
→ Datenbank-Schema wird automatisch erstellt beim ersten Start
→ Prüfe ob der User die Berechtigung hat, Tabellen zu erstellen

### Website zeigt keine Fahrzeuge
→ Prüfe ob Background-Job läuft (siehe Server-Logs)
→ Prüfe ob Daten in der Datenbank sind (kann direkt in Neon geprüft werden)
→ Erster Sync kann 1-2 Minuten dauern
