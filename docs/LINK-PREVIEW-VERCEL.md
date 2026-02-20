# Link-Vorschau (WhatsApp/mobile.de-Stil) – Vercel-Check

Damit Fahrzeug-Links die richtige Vorschau (Bild, „Marke Modell für Preis €“, km/kW/Kraftstoff) zeigen, muss **gsauto.de** von **diesem** Vercel-Projekt ausgeliefert werden und der Rewrite aktiv sein.

## Was geprüft wurde (Stand Check)

- **Fahrzeug-URL** `https://gsauto.de/fahrzeuge/8879641-bmw-320i` lieferte die **Standard-index.html** (og:title = „GS Automobile Rheinland …“, og:image = Logo).  
  → Der Rewrite zu `/api/vehicle-preview/:slug` hat **nicht** gegriffen.
- **Fahrzeug-API** `https://gsauto.de/api/vehicles/8879641` antwortet korrekt (Fahrzeugdaten).
- **Server:** Vercel (Response-Header `server: Vercel`).

## Nächste Schritte

1. **Neuen Deploy auslösen**  
   - GitHub: Push zu `main` (oder in Vercel: Deployments → „Redeploy“ beim letzten Build).  
   - Sicherstellen, dass der **neueste** Commit (mit `vercel.json` und `api/vehicle-preview/[slug].js`) gebaut wird.

2. **Domain in Vercel prüfen**  
   - Vercel Dashboard → Projekt → **Settings** → **Domains**.  
   - **gsauto.de** muss für **Production** eingetragen sein.  
   - DNS: A/CNAME für gsauto.de muss auf Vercel zeigen (z. B. `cname.vercel-dns.com`).

3. **Rewrite testen (nach Deploy)**  
   Im Browser oder mit curl:
   - `https://gsauto.de/api/vehicle-preview/8879641-bmw-320i` aufrufen.  
   - Im **Seitenquelltext** (Rechtsklick → „Seitenquelltext anzeigen“) nach `og:title` suchen.  
   - **Erfolg:** Es erscheint ein fahrzeugspezifischer Titel (z. B. „MINI Cooper für 26.700 €“) und `og:image` mit Fahrzeugbild.  
   - **Weiterleitung auf /fahrzeuge** oder generischer Titel → Function wird nicht getroffen oder API/Origin fehlt.

4. **Fahrzeug-URL testen**  
   - `https://gsauto.de/fahrzeuge/8879641-bmw-320i` aufrufen.  
   - Quelltext prüfen: gleiche og:*-Tags wie unter 3.  
   - Wenn hier weiterhin nur „GS Automobile Rheinland“ und Logo stehen → Rewrite greift noch nicht (älterer Deploy oder andere Hosting-Konfiguration).

5. **Facebook Sharing Debugger**  
   - https://developers.facebook.com/tools/debug/  
   - URL `https://gsauto.de/fahrzeuge/8879641-bmw-320i` eingeben → **„Scrape Again“**.  
   - Wenn die Vorschau dort stimmt, WhatsApp zeigt sie nach Cache-Ablauf bzw. neuem Link ebenfalls.

## Konfiguration im Repo

- **vercel.json:** Erster Rewrite: `/fahrzeuge/([^/]+)` → `/api/vehicle-preview/$1`.  
- **api/vehicle-preview/[slug].js:** Liest Fahrzeug per API, baut HTML mit vehicle-spezifischen og:* und twitter:* Meta-Tags (mobile.de-Stil).
