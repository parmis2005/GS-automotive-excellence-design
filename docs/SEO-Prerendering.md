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
- **Fahrzeug-Detailseiten:** Bereits umgesetzt über **`/api/vehicle-preview/[slug]`** (Link-Vorschau + fahrzeugspezifisches HTML).
- **404:** Ungültige Pfade (nicht in der Liste der bekannten Routen) liefern **HTTP 404** und eine feste 404-HTML-Seite aus der Middleware. Die React-NotFound-Seite bleibt für den Fall, dass doch einmal eine unbekannte URL zur App durchgereicht wird (mit noindex).

## Geänderte/neu angelegte Dateien

| Datei | Änderung |
|-------|----------|
| `api/page-html.js` | **Neu.** Serverless-Funktion: liefert HTML für `/`, `/fahrzeuge`, `/unternehmen` mit angepasstem Head und statischem Intro-Block in `#root`. |
| `middleware.js` | **Erweitert.** Ruft für `/`, `/fahrzeuge`, `/unternehmen` die page-html-API auf; für `/fahrzeuge/:slug` weiter vehicle-preview; für ungültige Pfade 404 mit Inline-HTML. |
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

## Kurzfassung

- **Ursache Soft 404:** Gleiche, fast leere `index.html` für alle URLs; kein sichtbarer, route-spezifischer Inhalt im ersten HTML.
- **Lösung:** Pre-Rendering für `/`, `/fahrzeuge`, `/unternehmen` über `api/page-html.js` + Middleware; sichtbarer Intro-Block (H1 + Text) in `#root`; echte 404 für ungültige Pfade; noindex für NotFound und Erfolgsseiten.
