# SEO-Checkliste für Code-Änderungen

## 🎯 SEO-Aspekte, die bei JEDER Code-Änderung berücksichtigt werden

### 1. Meta-Tags & SEO-Komponente
- [ ] **Neue Seiten/Komponenten**: SEO-Komponente hinzufügen
- [ ] **Titel**: Einzigartig, beschreibend, max. 60 Zeichen, Keywords enthalten
- [ ] **Description**: Einzigartig, max. 160 Zeichen, Call-to-Action
- [ ] **Canonical URL**: Immer setzen, keine Duplicate Content
- [ ] **Open Graph Tags**: Für Social Media Sharing
- [ ] **Twitter Cards**: Für Twitter Sharing

### 2. Structured Data (JSON-LD)
- [ ] **Neue Seiten**: Passendes Schema hinzufügen (Product, Article, FAQPage, etc.)
- [ ] **Breadcrumbs**: Immer mit BreadcrumbList Schema
- [ ] **LocalBusiness**: Auf allen Seiten (bereits implementiert)
- [ ] **Schema-Validierung**: Strukturierte Daten testen

### 3. Semantisches HTML
- [ ] **H1-Tags**: Nur EIN H1 pro Seite, Keywords enthalten
- [ ] **H2-H6 Tags**: Logische Hierarchie, beschreibend
- [ ] **Alt-Texte**: Alle Bilder haben beschreibende Alt-Texte
- [ ] **Semantische Tags**: `<main>`, `<article>`, `<section>`, `<nav>`, `<header>`, `<footer>`

### 4. Performance & Core Web Vitals
- [ ] **Lazy Loading**: Bilder mit `loading="lazy"` (außer Above-the-Fold)
- [ ] **Image Optimization**: WebP, responsive images (srcset)
- [ ] **Code Splitting**: Nur notwendigen Code laden
- [ ] **LCP (Largest Contentful Paint)**: < 2.5s
- [ ] **FID (First Input Delay)**: < 100ms
- [ ] **CLS (Cumulative Layout Shift)**: < 0.1

### 5. URL-Struktur
- [ ] **Sprechende URLs**: `/fahrzeuge/bmw-320d-2023` statt `/fahrzeuge/123`
- [ ] **Kurz & prägnant**: Max. 3-4 Ebenen
- [ ] **Keywords in URLs**: Wo sinnvoll
- [ ] **Konsistenz**: Einheitliche URL-Struktur

### 6. Interne Verlinkung
- [ ] **Breadcrumbs**: Auf allen Seiten
- [ ] **Verwandte Inhalte**: Links zu ähnlichen Fahrzeugen
- [ ] **Anker-Links**: Für lange Seiten
- [ ] **Sinnvolle Anchor-Texte**: Beschreibend, nicht "Hier klicken"

### 7. Mobile-First
- [ ] **Responsive Design**: Funktioniert auf allen Geräten
- [ ] **Touch-Targets**: Mind. 44x44px
- [ ] **Mobile Usability**: Keine horizontalen Scrollbars
- [ ] **Viewport Meta Tag**: Korrekt gesetzt

### 8. Accessibility (für SEO)
- [ ] **ARIA-Labels**: Wo notwendig
- [ ] **Kontrast**: WCAG AA Standard
- [ ] **Keyboard Navigation**: Funktioniert ohne Maus
- [ ] **Screen Reader**: Inhalt ist verständlich

### 9. Content-Qualität
- [ ] **Einzigartiger Content**: Keine Duplikate
- [ ] **Keyword-Dichte**: Natürlich, nicht übertrieben (2-3%)
- [ ] **Lokale Keywords**: "Krefeld", "Niederrhein", "Rheinland"
- [ ] **Frische Inhalte**: Regelmäßig aktualisiert

### 10. Technisches SEO
- [ ] **HTTPS**: Immer verwendet
- [ ] **XML Sitemap**: Aktualisiert bei neuen Seiten
- [ ] **robots.txt**: Korrekt konfiguriert
- [ ] **404-Errors**: Behandelt (Redirect oder 404-Seite)
- [ ] **301 Redirects**: Bei URL-Änderungen

---

## 📋 Checkliste für spezifische Änderungen

### Neue Seite/Komponente
- [ ] SEO-Komponente importiert und verwendet
- [ ] Einzigartige Meta-Tags (Title, Description)
- [ ] Structured Data (wenn relevant)
- [ ] Breadcrumbs
- [ ] H1-Tag mit Keywords
- [ ] Canonical URL
- [ ] In Sitemap aufgenommen

### Neue Fahrzeug-Komponente
- [ ] Product Schema (JSON-LD)
- [ ] Einzigartige Meta-Tags pro Fahrzeug
- [ ] Alt-Texte für Bilder
- [ ] Sprechende URLs (`/fahrzeuge/{id}`)
- [ ] Verwandte Fahrzeuge (interne Links)

### Bilder hinzufügen
- [ ] Alt-Text beschreibend und keyword-relevant
- [ ] Lazy Loading (außer Above-the-Fold)
- [ ] Responsive Images (srcset)
- [ ] WebP Format (optional, aber empfohlen)
- [ ] Komprimierte Größe

### Content-Änderungen
- [ ] Keywords natürlich integriert
- [ ] Lokale Keywords ("Krefeld", etc.)
- [ ] Einzigartiger Content (keine Duplikate)
- [ ] Semantisches HTML
- [ ] Interne Verlinkung

---

## 🔍 SEO-Informationen, die wir brauchen

### Für besseres SEO brauche ich von dir:

1. **Haupt-Keywords & Zielgruppen**
   - Welche Keywords sind am wichtigsten?
   - Zielgruppe (z.B. "Gebrauchtwagen Krefeld", "Auto kaufen Niederrhein")?

2. **Lokales SEO**
   - Adresse vollständig (bereits vorhanden: Kuhleshütte 149, 47809 Krefeld)
   - Google My Business URL (falls vorhanden)
   - Öffnungszeiten (bereits vorhanden)
   - Weitere Standorte?

3. **Content-Strategie**
   - Sollen Blog-Artikel/News-Sektion?
   - FAQ-Sektion mit häufigsten Fragen?
   - Kundenbewertungen/Testimonials?

4. **Konkurrenz-Analyse**
   - Welche Websites sind die Hauptkonkurrenten?
   - Was machen sie besser/schlechter?

5. **Tracking & Analytics**
   - Google Analytics 4 Property ID (falls vorhanden)
   - Google Search Console (bereits eingerichtet?)
   - Weitere Tracking-Tools?

6. **Social Media**
   - Facebook, Instagram, LinkedIn URLs
   - Sollen Social Media Links prominent platziert werden?

7. **Weitere Services/Leistungen**
   - Welche Services sollen besonders hervorgehoben werden?
   - Spezialisierungen (z.B. bestimmte Marken, E-Autos)?

8. **Conversion-Ziele**
   - Was ist das Hauptziel? (Anrufe, Kontaktformular, Fahrzeug-Views?)
   - Welche Seiten sollen besonders optimiert werden?

---

## 💡 SEO-Best Practices für diese Website

### Prioritäten (basierend auf dem, was wir wissen):

1. **Fahrzeug-Detailseiten** (höchste Priorität)
   - Einzigartige Meta-Tags für jedes Fahrzeug
   - Product Schema
   - Verwandte Fahrzeuge
   - Call-to-Action optimiert

2. **Lokales SEO**
   - LocalBusiness Schema auf allen Seiten ✅
   - Adresse & Kontaktdaten ✅
   - Google My Business Integration

3. **Performance**
   - Schnelle Ladezeiten
   - Bildoptimierung
   - Lazy Loading

4. **Mobile-First**
   - Responsive Design ✅
   - Touch-Targets
   - Mobile Usability

5. **Interne Verlinkung**
   - Breadcrumbs ✅
   - Verwandte Inhalte
   - Kategorie-Pages (optional)

---

## 🚨 Wichtige Hinweise

- **KEINE Keyword-Stuffing**: Keywords natürlich integrieren
- **Einzigartiger Content**: Jede Seite muss einzigartig sein
- **User Experience First**: SEO soll UX verbessern, nicht verschlechtern
- **Regelmäßige Updates**: Content sollte frisch bleiben
- **Monitoring**: Rankings & Traffic regelmäßig prüfen

---

## 📝 Notizen

- Aktuelle Implementierung: ✅ Meta-Tags, ✅ Structured Data, ✅ Breadcrumbs
- Noch zu implementieren: Sitemap-Generator, FAQ-Schema, Blog (optional)
- Wichtig: Bei jeder neuen Seite/Komponente SEO-Komponente hinzufügen!
