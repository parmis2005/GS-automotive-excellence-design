# SEO Pre-Rendering & Soft-404 Behebung

## Warum Google „Soft 404“ für /fahrzeuge gemeldet hat

- **SPA-Verhalten:** Bei einer reinen Client-Side-App bekommt der Crawler für jede URL dieselbe `index.html` (z.B. nur `<div id="root"></div>`). Der sichtbare Inhalt entsteht erst nach dem Laden und Ausführen von JavaScript.
- **Bewertung durch Google:** Wenn die URL (z.B. `/fahrzeuge`) inhaltlich zur Startseite wirkt (gleicher Titel, gleiche Meta, wenig/kein Text im ersten HTML), wertet Google das oft als **Soft 404**: „Diese Seite scheint keine eigene, sinnvolle Seite zu sein.“

Durch **serverseitig ausgeliefertes HTML** mit route-spezifischem Titel, Meta und sichtbarem Intro-Text (H1 + Absatz) wird `/fahrzeuge` (und andere wichtige Routen) als eigene Seite erkennbar und die Soft-404-Meldung kann entfallen.

## Umgesetzte Lösung (ohne vollständige SSR-Migration)

- **Pre-Rendering per API:** Die Routen `/`, `/fahrzeuge`, `/unternehmen` werden in der **Edge-Middleware** abgefangen. Statt der statischen `index.html` wird die **`/api/page-html`**-Funktion aufgerufen. Diese liefert die gleiche App-Shell, aber mit:
  - angepasstem `<title>`, Meta-Description, **Meta-Keywords** (routenspezifisch), Canonical, Open Graph, Twitter
  - **JSON-LD:** Auf `/fahrzeuge` werden **ItemList** (Liste der Gebrauchtwagen mit Namen und URL) und **BreadcrumbList** eingefügt; auf `/unternehmen` **BreadcrumbList**. So erkennt Google die Seite als strukturierte Liste und die Navigation.
  - **sichtbarem Inhalt im ersten HTML:** z.B. `<main class="seo-static-content"><h1>…</h1><p>…</p></main>` sowie auf `/fahrzeuge` eine **Sektion** mit H2 „Aktuelle Gebrauchtwagen“ und bis zu 80 Fahrzeuglinks (Marke, Modell, Baujahr, Preis, km, Kraftstoff). Beim Mount ersetzt React diesen Block durch die echte App – für Crawler und Nutzer ohne JS ist sofort Text da.
- **Fahrzeug-Detailseiten:** **`/api/vehicle-preview/[slug]`** liefert vollständiges HTML: Meta-Tags **und** sichtbaren Body-Inhalt (H1, Preis, Specs, Bild, Kurzbeschreibung, JSON-LD Product). Fahrzeugdaten kommen **serverseitig** direkt vom Backend (mit Retry). Kein 200 mit Fehlerbox: Fahrzeug unbekannt → **404**, Backend nicht erreichbar → **503**.
- **404:** Ungültige Pfade (nicht in der Liste der bekannten Routen) liefern **HTTP 404** und eine feste 404-HTML-Seite aus der Middleware. Die React-NotFound-Seite bleibt für den Fall, dass doch einmal eine unbekannte URL zur App durchgereicht wird (mit noindex).

## Geänderte/neu angelegte Dateien

| Datei | Änderung |
|-------|----------|
| `api/page-html.js` | **Neu.** Serverless-Funktion: liefert HTML für `/`, `/fahrzeuge`, `/unternehmen` mit angepasstem Head und statischem Intro-Block in `#root`. |
| `api/vehicle-preview/[slug].js` | **Erweitert.** Liefert für `/fahrzeuge/:slug` vollständiges HTML: Head (Meta, JSON-LD Product) + Body (H1, Preis, Specs, Bild, Kurzbeschreibung). Fahrzeug per BACKEND_API mit Retry; 404 wenn nicht gefunden, 503 bei Backend-Ausfall. |
| `middleware.js` | **Erweitert.** Ruft für `/`, `/fahrzeuge`, `/unternehmen` die page-html-API auf; für `/fahrzeuge/:slug` weiter vehicle-preview (Status 200/404/503 wird durchgereicht); für ungültige Pfade 404 mit Inline-HTML. |
| `public/404.html` | **Neu.** Statische 404-Seite (noindex), wird auch von der Middleware als 404-Body genutzt (Inline-Kopie). |
| `src/pages/NotFound.tsx` | **Angepasst.** Deutscher Text, H1 „Seite nicht gefunden“, Helmet mit Titel, canonical, `noindex, nofollow`. |
| `public/robots.txt` | **Angepasst.** `Disallow: /kontakt-erfolgreich` ergänzt. |
| `docs/SEO-Prerendering.md` | **Neu.** Diese Beschreibung und Testanleitung. |

## Lokal testen

### 1. View Source (ausgeliefertes HTML prüfen)

- **Lokal:** Nach `npm run build` und `npm run preview` (oder mit laufendem Server) im Browser:
  - `http://localhost:4173/` → Rechtsklick → „Seitenquelltext anzeigen“ (bzw. View Page Source).
  - `http://localhost:4173/fahrzeuge` → gleiches Vorgehen.
- **Prüfen:**
  - Im Quelltext nach `<!-- page-html: / -->` bzw. `<!-- page-html: /fahrzeuge -->` im `<head>` suchen.
  - Im `<body>` innerhalb von `<div id="root">` ein `<main class="seo-static-content">` mit **H1** und **Absatz** sehen.
  - Eindeutiger `<title>` und `<meta name="description">` je Route.

**Hinweis:** Die **page-html-Logik** läuft auf Vercel (Serverless + Middleware). Lokal mit Vite gibt es keine Middleware – du siehst die normale SPA. Für den **vollständigen** Test der Pre-Rendering-Antwort:

- **Entweder** nach dem Deploy auf Vercel die gleichen URLs aufrufen und View Source dort prüfen.
- **Oder** die API direkt aufrufen:  
  `GET https://<deine-vercel-url>/api/page-html?path=/fahrzeuge` → Antwort-HTML sollte den Kommentar und den statischen Block enthalten.

### 2. Google Rich Results / URL-Prüfung

- In der **Google Search Console** → „URL-Prüfung“ die Live-URL eingeben, z.B. `https://gsauto.de/fahrzeuge`.
- „Live-URL testen“ / „Indexierung anfordern“ – Google lädt die Seite und zeigt, was gecrawlt wurde.
- Erwartung: Keine Soft-404-Meldung; Titel und Beschreibung passen zur Fahrzeugseite; im angezeigten HTML sollte der Intro-Text (H1 + Beschreibung) vorkommen.

### 3. Echten Content im ausgelieferten HTML prüfen

- View Source auf der **produktiven** URL (z.B. `https://gsauto.de/fahrzeuge`).
- Im Quelltext suchen nach:
  - `Gebrauchtwagen Krefeld & Umgebung` (H1)
  - dem beschreibenden Absatz zur Fahrzeugsuche.
- Wenn diese Texte **ohne** JavaScript im ersten HTML stehen, sieht Google denselben Inhalt und die Seite gilt nicht mehr als „leer“ bzw. Soft 404.

### 4. 404 prüfen

- Eine nicht existierende URL aufrufen, z.B. `https://gsauto.de/diese-seite-gibt-es-nicht`.
- Erwartung: **HTTP 404** (Status in DevTools → Network), Body mit „Seite nicht gefunden“ und noindex.
- Optional: In der Middleware ist eine Inline-404-HTML; die statische `public/404.html` wird bei Bedarf von Vercel für 404 genutzt.

## Fahrzeugdetailseiten (/fahrzeuge/:slug)

### Serverseitige Render-Logik (vehicle-preview)

1. **Slug parsen** → Fahrzeug-ID (erster Segment vor dem ersten `-`).
2. **Fahrzeug laden:** `GET BACKEND_API/api/vehicles/:id` (direkt Backend, **nicht** gsauto.de – vermeidet 499/Timeouts). **Retry:** bis zu 2 Wiederholungen bei Fehlern, Timeout 10 s.
3. **Nicht gefunden** (404 vom Backend oder leere Daten) → **HTTP 404** mit noindex-HTML „Fahrzeug nicht gefunden“, kein 200.
4. **Backend-Fehler/Netzwerkfehler** nach Retry → **HTTP 503** mit noindex-HTML „Vorübergehend nicht verfügbar“, `Retry-After: 60`.
5. **Bei Erfolg:** `index.html` von gsauto.de holen, dann:
   - Head: Titel, Meta, Canonical, og:* / twitter:*, **JSON-LD Product** (Preis, Marke, Modell, Bild, Angebot).
   - **Body:** `#root` mit vollständigem Inhalt füllen:
     - **H1:** Marke Modell Baujahr
     - **Preis** (oder „Preis auf Anfrage“)
     - **Specs:** Erstzulassung, Kilometerstand, Kraftstoff, Leistung (dl/dt/dd)
     - **Bild:** erstes Fahrzeugbild (absolut URL)
     - **Kurzbeschreibung** (bis 300 Zeichen aus `description` oder generiert)
     - Link „Weitere Gebrauchtwagen“
6. **Logging:** `console.warn` bei 404, `console.error` bei Fetch-Fehlern (in Vercel Logs sichtbar).

### Bisher clientseitig, jetzt nicht mehr nötig für Crawler

- **Vorher:** Die Seite lieferte nur Meta im Head; der **Body** war leer (`<div id="root"></div>`). Beim Rendern lud die **React-App** das Fahrzeug per **clientseitigem** `fetch` (`useVehicle` → `fetchVehicleById` → `GET /api/vehicles/:id`). Schlug dieser Request fehl (499, Timeout, CORS, Bot-Block), wurde eine **Fehlerbox** gerendert → Google wertete das als Soft 404.
- **Jetzt:** Der **vollständige Fahrzeuginhalt** steht bereits im ersten HTML. Google braucht keinen clientseitigen Fetch. Die React-App ersetzt beim Mount den Pre-Render-Block; wenn der spätere Client-Fetch fehlschlägt, sehen Nutzer ggf. noch die Fehlerbox, aber **Crawler sehen den serverseitigen Inhalt**.

### Warum 499 / „4 von 11 Ressourcen“

- **499 Client Closed Request:** Entstand u.a., wenn die Serverless-Funktion **gsauto.de** (die eigene Domain) aufrief (`GET https://gsauto.de/api/vehicles/:id`). Dabei kann die Verbindung vor Antwortende geschlossen werden (z.B. Timeout, Edge-Weiterleitung). **Abhilfe:** Fahrzeug wird jetzt **direkt** von `BACKEND_API` (209.38.251.38:3001) geladen – kein Aufruf der eigenen Domain nötig.
- **4 von 11 Ressourcen:** Kann von externen Ressourcen kommen (Bilder, Scripts, Fonts). Wichtig: Der **wichtige Seiteninhalt** (H1, Preis, Daten, Beschreibung, ein Bild) steht im **HTML-Body**; fehlende Zusatzressourcen führen nicht mehr dazu, dass die Seite als Fehlerseite (Soft 404) gilt.

### Prüfen: View-Source und 404

- **View Source** auf einer echten Detail-URL, z.B. `https://gsauto.de/fahrzeuge/12345-bmw-320`:
  - Im **Body** innerhalb von `<div id="root">` müssen sichtbar sein: **H1** (z.B. „BMW 320 2024“), **Preis**, **Erstzulassung/Kilometerstand/Kraftstoff**, **Beschreibung**, **img** mit Fahrzeugbild, **JSON-LD** im Head (`application/ld+json` Product).
- **Nicht existierendes Fahrzeug:** z.B. `https://gsauto.de/fahrzeuge/99999999-xyz`:
  - Erwartung: **HTTP 404** (Status in DevTools → Network), Body mit „Fahrzeug nicht gefunden“ und `noindex, nofollow`. Kein 200 mit Fehlerseite.

## Kurzfassung

- **Ursache Soft 404:** Gleiche, fast leere `index.html` für alle URLs; kein sichtbarer, route-spezifischer Inhalt im ersten HTML. Bei Detailseiten: leerer Body + clientseitiger Fetch → bei Fehlern Fehlerbox → Soft 404.
- **Lösung:** Pre-Rendering für `/`, `/fahrzeuge`, `/unternehmen` über `api/page-html.js`; für `/fahrzeuge/:slug` vollständiger Body-Inhalt über `api/vehicle-preview/[slug].js` (Backend-Direktaufruf, Retry, 404/503). Echte 404 für ungültige Pfade und nicht existierende Fahrzeuge; noindex für NotFound und Erfolgsseiten.
