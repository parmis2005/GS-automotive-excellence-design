# SEO: Wie es funktioniert & was umgesetzt wurde

## Kurz: Wie Google (SEO) funktioniert

1. **Crawling** – Google liest deine Seiten (Startseite, Sitemap, verlinkte URLs).
2. **Indexierung** – Wichtige Inhalte (Titel, Beschreibung, Überschriften, Text) werden gespeichert.
3. **Ranking** – Bei einer Suche (z. B. „Autohaus Krefeld“) wählt Google passende Seiten aus und sortiert sie nach Relevanz und Vertrauen.

**Was die Relevanz beeinflusst:**

- **On-Page:** Titel (`<title>`), Meta-Description, Überschriften (H1, H2), sichtbarer Text mit Suchbegriffen, strukturierte Daten (JSON-LD).
- **Technisch:** Schnelle Ladezeit, mobile Darstellung, klare URLs, Sitemap, keine 404 für wichtige Links.
- **Off-Page:** Links von anderen Seiten, Erwähnungen (z. B. „GS Automobile Rheinland“). „GS Auto“ auf Platz 1 zeigt: Google vertraut euch bereits für den Namen.

**Modell-Suchen (z. B. „BMW i4“):**  
Wenn ihr einen BMW i4 im Bestand habt, ist die **Fahrzeugdetailseite** die richtige Seite dafür. Dafür braucht Google:

- eine **eigene URL** pro Auto (habt ihr: `/fahrzeuge/123-bmw-i4`),
- einen **eindeutigen Titel** mit Marke + Modell (z. B. „BMW i4 für 45.000 € | GS Automobile Rheinland“),
- **Structured Data** (Product-Schema) und
- dass die URL **indexiert** wird (Sitemap oder Verlinkung von der Fahrzeugsuche).

Je mehr solche Detailseiten indexiert sind, desto eher erscheint eure Seite bei „BMW i4“, „Opel Corsa“ usw.

---

## Standort Krefeld, Sichtbarkeit in Nachbarstädten

Ihr habt **einen Standort in Krefeld**, wollt aber auch bei Suchen wie „Autohaus Meerbusch“, „Autohaus Willich“ usw. gefunden werden. Das ist üblich und in Ordnung: Ihr bedient die Region, der nächste Händler für viele Kunden in diesen Städten. Umgesetzt sind **Krefeld** (Standort) plus **Meerbusch, Willich, Kempen, Tönisvorst** im Einzugsgebiet (areaServed, Meta, About-Text). Weitere Städte (z. B. Neuss, Mönchengladbach) könnt ihr ergänzen, wenn ihr sie wirklich bedient – **4–6 Städte** wirken glaubwürdig, deutlich mehr kann unnatürlich wirken. Wichtig: Im Text klar bleiben („Autohaus in Krefeld – auch für Meerbusch, Willich …“), damit niemand denkt, ihr hättet mehrere Filialen.

---

## Was mehr Suchbegriffe bringt – und wo Grenzen sind

- **Sinnvoll:**  
  Klare Schwerpunkte wie **Autohaus Krefeld**, **Autohaus Meerbusch**, **BMW Krefeld**, **Opel Krefeld**, **Gebrauchtwagen**, **GS Automobile GmbH** in Titel, Beschreibung und **einmal** natürlich im Fließtext (z. B. About).  
  Dazu pro Fahrzeug: **Marke + Modell** (z. B. BMW i4) auf der Detailseite.

- **Weniger sinnvoll:**  
  Dutzende weitere Stichwörter künstlich wiederholen (Keyword-Stuffing). Google wertet das ab. Besser: 1–2 Kernbegriffe pro Seite, rest natürlich im Text.

- **Modell-Ranking:**  
  Kommt vor allem von **vielen indexierten Fahrzeugseiten** mit korrektem Titel/Schema, nicht von noch mehr Keywords auf der Startseite.

---

## Umgesetzte Optimierungen

### 1. Startseite (index.html + getDefaultSEO)

- **Titel:** „Autohaus Krefeld & Meerbusch | GS Automobile Rheinland GmbH – Gebrauchtwagen, BMW, Opel“
- **Meta-Description & Keywords:** Autohaus Krefeld, Autohaus Meerbusch, GS Automobile GmbH, GS Auto, Gebrauchtwagen (Krefeld/Meerbusch), BMW/Opel (Krefeld/Meerbusch), Jahreswagen, Finanzierung, Inzahlungnahme, Fahrzeugankauf
- **Structured Data (JSON-LD):**  
  - `alternateName`: „GS Automobile GmbH“, „GS Auto“, „GS Automobile Rheinland“ (für Suchen wie „GS Automobile GmbH“)  
  - `areaServed`: Krefeld, Meerbusch  
  - Beschreibungstext mit Autohaus, Krefeld, Meerbusch, Gebrauchtwagen, BMW, Opel

### 2. Fahrzeugsuche (getVehiclesPageSEO)

- Titel/Beschreibung/Keywords mit Gebrauchtwagen Krefeld & Meerbusch, BMW/Opel, Autohaus Krefeld/Meerbusch, GS Auto

### 3. Fahrzeugdetailseiten (getVehicleSEO)

- **Titel:** z. B. „BMW i4 für 45.000 € | GS Automobile Rheinland“ (gut für „BMW i4“)
- **Keywords pro Auto:** Marke + Modell, „… Gebrauchtwagen“, „… Krefeld“, „… Meerbusch“, „… kaufen“, Autohaus Krefeld, GS Automobile Rheinland
- Product-Schema (Marke, Modell, Preis, etc.) war bereits vorhanden und bleibt Grundlage für Modell-Suchen

### 4. Lokale Zuordnung (generateLocalBusinessSchema)

- `alternateName` und `areaServed` (Krefeld, Meerbusch) wie in index.html
- Slogan/Beschreibung mit Autohaus, Krefeld, Meerbusch, Gebrauchtwagen, BMW, Opel

### 5. Sichtbarer Text (AboutSection)

- Ein Satz mit „Autohaus in Krefeld“, „Krefeld und Meerbusch“, „Gebrauchtwagen“ und Jahreswagen, natürlich eingebunden

---

## Was du für „schnell ganz oben“ noch tun kannst

1. **Indexierung abwarten** – Google braucht Zeit. Sitemap ist gemeldet; weitere Seiten (Fahrzeuge, Unterseiten) werden nach und nach erfasst.
2. **Fahrzeug-URLs in der Sitemap** – Wenn viele Fahrzeuge dauerhaft im Bestand sind, lohnt sich eine **dynamische Sitemap** (z. B. `/sitemap.xml` + `/sitemap-fahrzeuge.xml` mit allen Detail-URLs), damit Google alle „BMW i4“-Seiten findet. Das wäre ein separates kleines Backend/API-Feature.
3. **Backlinks & Erwähnungen** – Einträge in Google Business Profile (Krefeld/Umgebung), Branchenverzeichnisse, lokale Seiten mit Link zu gsauto.de stärken das Vertrauen und helfen bei „Autohaus Krefeld“ / „GS Automobile GmbH“.
4. **Google Search Console** – Sitemap einreichen, Indexierungsstatus prüfen, Suchanfragen beobachten (welche Begriffe bringen Klicks).

---

## Kurzfassung

- **SEO** = Relevante Suchbegriffe in Titel, Beschreibung, Überschriften und Text + technisch saubere, schnelle Seite + Strukturierte Daten.
- **Umgesetzt:** Autohaus Krefeld/Meerbusch, BMW/Opel (Krefeld/Meerbusch), Gebrauchtwagen, GS Automobile GmbH / GS Auto in Meta, Schema und About-Text. Fahrzeugseiten mit Marke+Modell für Suchanfragen wie „BMW i4“.
- **Weitere Suchbegriffe:** Nur sinnvoll, wenn sie **natürlich** in echten Texten vorkommen; kein Keyword-Stuffing. Modell-Ranking verbessert ihr vor allem durch **viele indexierte Fahrzeugdetailseiten** und optional eine Sitemap mit allen Fahrzeug-URLs.
