# Migration Guide: Joomla → React

## 🔄 Schritt-für-Schritt Migrationsplan

### Phase 1: Vorbereitung (1-2 Wochen vor Launch)

#### 1.1 Backup & Dokumentation
- ✅ Komplettes Backup der Joomla-Website
- ✅ Alle URLs dokumentieren (inkl. Parameter)
- ✅ Google Search Console Export (Keywords, Rankings)
- ✅ Google Analytics Export (Traffic-Daten)

#### 1.2 URL-Mapping erstellen
Erstelle eine Mapping-Tabelle:
```
Alte Joomla-URL → Neue React-URL
/fahrzeuge/detail/bmw-320d-123 → /fahrzeuge/8409264
/kontakt → /#kontakt
/ueber-uns → /#about
```

### Phase 2: Parallelbetrieb (1-2 Wochen)

#### 2.1 Subdomain Setup
- React-Website auf `new.gs-automobile-rheinland.de` deployen
- Testing & QA durchführen
- SEO-Checks (Structured Data, Meta-Tags, etc.)

#### 2.2 Canary Launch (Optional)
- 10% Traffic auf neue Website leiten
- Monitoring & Feedback sammeln
- Bugs fixen

### Phase 3: Migration (Launch-Tag)

#### 3.1 DNS/Server-Konfiguration
- Alte Joomla-Website umbenennen/verschieben
- Neue React-Website auf Hauptdomain deployen
- 301 Redirects aktivieren (siehe unten)

#### 3.2 301 Redirects (Kritisch!)

**Apache (.htaccess):**
```apache
# Redirects für einzelne Fahrzeuge
Redirect 301 /fahrzeuge/detail/bmw-320d-123 /fahrzeuge/8409264

# Allgemeine Redirects
Redirect 301 /kontakt /#kontakt
Redirect 301 /ueber-uns /#about

# Fallback für unbekannte URLs
RewriteEngine On
RewriteCond %{REQUEST_URI} ^/fahrzeuge/detail/(.*)$
RewriteRule ^(.*)$ /fahrzeuge [R=301,L]
```

**Nginx:**
```nginx
# Redirects für einzelne Fahrzeuge
location = /fahrzeuge/detail/bmw-320d-123 {
    return 301 /fahrzeuge/8409264;
}

# Allgemeine Redirects
location = /kontakt {
    return 301 /#kontakt;
}
```

#### 3.3 Google Search Console
1. Neue Sitemap einreichen
2. URL-Inspection für wichtige Seiten
3. Alte Sitemap deaktivieren (nicht löschen!)

### Phase 4: Post-Migration (Erste 2 Wochen)

#### 4.1 Monitoring
- ✅ Google Search Console täglich prüfen
- ✅ 404 Errors identifizieren & fixen
- ✅ Ranking-Monitoring (Ahrefs/SEMrush)
- ✅ Traffic-Analyse (Google Analytics)

#### 4.2 Quick Wins
- Broken Links fixen
- Fehlende Redirects hinzufügen
- Page Speed optimieren
- Mobile Usability prüfen

### Phase 5: Stabilisierung (Monat 1-3)

#### 5.1 Content-Optimierung
- Einzigartige Beschreibungen für alle Fahrzeuge
- FAQ-Sektion hinzufügen
- Blog/News-Sektion (optional)

#### 5.2 Link-Building
- Alte Backlinks prüfen (sollten via 301 Redirects funktionieren)
- Neue Backlinks aufbauen
- Lokales SEO (Google My Business)

---

## 🚨 Wichtige Warnungen

1. **301 Redirects sind kritisch!** Ohne Redirects verlierst du Rankings
2. **Alte Website nicht sofort löschen** - Backup behalten
3. **Monitoring ist essentiell** - täglich prüfen in ersten Wochen
4. **Robots.txt nicht vergessen** - alte Sitemaps deaktivieren
5. **HTTPS muss funktionieren** - SSL-Zertifikat prüfen

---

## 📊 Erfolgs-Metriken

### Woche 1:
- 301 Redirects funktionieren (0% 404 Errors)
- Neue Sitemap wird gecrawlt
- Structured Data validiert

### Monat 1:
- Rankings stabil (max. 10% Drop akzeptabel)
- Traffic normalisiert sich
- Keine kritischen SEO-Fehler

### Monat 3:
- Rankings zurück auf altem Niveau oder besser
- Traffic stabil oder besser
- Alle SEO-Features implementiert

---

## 💡 Best Practices

1. **Schrittweise Migration**: Nicht alles auf einmal
2. **Kommunikation**: Google Search Console "URL-Änderung" melden
3. **Backup behalten**: Alte Website mindestens 6 Monate als Backup
4. **Monitoring Tools**: Google Search Console + Analytics täglich prüfen
5. **Geduld**: Rankings können 2-4 Wochen brauchen, um sich zu stabilisieren
