/**
 * Vercel Serverless Function: Liefert vorgerendertes HTML für wichtige Routen
 * (/, /fahrzeuge, /unternehmen), damit Google im initialen HTML sichtbaren
 * Content sieht und keine Soft-404 meldet. React ersetzt #root-Inhalt beim Mount.
 */
export const config = { maxDuration: 15 };

const BASE_URL = "https://gsauto.de";
const BACKEND_API = "http://209.38.251.38:3001";

/** Slug für Detail-URL: id-marke-modell (wie in vehicleSlug.ts) */
function slugify(text) {
  if (!text || typeof text !== "string") return "";
  return String(text)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/ä/g, "ae")
    .replace(/ö/g, "oe")
    .replace(/ü/g, "ue")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "fahrzeug";
}
function getVehicleDetailSlug(id, brand, model) {
  const safeId = (id || "").trim() || "0";
  const marke = slugify(brand || "");
  const modell = slugify(model || "");
  return [safeId, marke, modell].filter(Boolean).join("-");
}

/** Preis ohne Cent für Anzeige (z. B. 25.000) */
function formatPrice(price) {
  const n = Number(price);
  if (!Number.isFinite(n) || n <= 0) return "";
  return Math.round(n).toLocaleString("de-DE", { maximumFractionDigits: 0, minimumFractionDigits: 0 });
}

/** Kilometerstand formatiert (z. B. 50.000 km) */
function formatMileage(km) {
  const n = Number(km);
  if (!Number.isFinite(n) || n < 0) return "";
  return n.toLocaleString("de-DE", { maximumFractionDigits: 0 }) + " km";
}

const ROUTE_CONFIG = {
  "/": {
    title: "GS Automobile Rheinland GmbH | Gebrauchtwagen Krefeld",
    description:
      "Autohaus in Krefeld: Gebrauchtwagen, BMW, Opel. Für Kunden aus Düsseldorf, Neuss, Mönchengladbach. Finanzierung, DEKRA, Garantie. GS Automobile Rheinland.",
    ogDescription: "Gebrauchtwagen, BMW und Opel in Krefeld. Finanzierung, DEKRA, Garantie. GS Automobile Rheinland.",
    canonical: BASE_URL,
    keywords:
      "Autohaus Krefeld, Autohaus Düsseldorf, Gebrauchtwagen Krefeld, BMW Krefeld, Opel Krefeld, Jahreswagen, Finanzierung Krefeld, DEKRA, GS Automobile Rheinland",
    bodyContent: `
    <main class="seo-static-content" aria-label="Inhalt">
      <h1>GS Automobile Rheinland GmbH – Autohaus Krefeld</h1>
      <p>Ihr Ansprechpartner für Gebrauchtwagen, Jahreswagen, BMW und Opel am Niederrhein. Die GS Automobile Rheinland GmbH betreut Kunden aus Krefeld, Düsseldorf, Neuss, Mönchengladbach, Duisburg, Moers, Meerbusch und Willich. Finanzierung, DEKRA-Gutachten und Garantie – fair und transparent.</p>

      <h2>Gebrauchtwagen und Jahreswagen in Krefeld</h2>
      <p>Bei der GS Automobile Rheinland GmbH finden Sie eine große Auswahl an geprüften Gebrauchtwagen und jungen Jahreswagen. Ob BMW, Opel, Mini oder andere Marken: Wir legen Wert auf einwandfreie Historie, DEKRA-Check und faire Preise. Unser Autohaus in Krefeld ist gut erreichbar für Kunden aus dem gesamten Rheinland – von Düsseldorf über Neuss und Mönchengladbach bis Duisburg, Moers, Meerbusch, Willich, Kempen und Tönisvorst.</p>
      <p>Alle Fahrzeuge werden mit transparenten Angaben zu Kilometerstand, Ausstattung und Preis präsentiert. Nutzen Sie unsere Online-Fahrzeugsuche für eine erste Übersicht oder besuchen Sie uns direkt vor Ort – wir beraten Sie gerne zu Ihrem Wunschfahrzeug.</p>

      <h2>Warum Gebrauchtwagen beim Autohaus GS Automobile Rheinland?</h2>
      <p>Langjährige Partnerschaften mit Leasinggesellschaften und Flottenanbietern ermöglichen uns, hochwertige Fahrzeuge zu attraktiven Konditionen anzubieten. Transparente Beratung, ausgezeichnetes Preis-Leistungs-Verhältnis und die Möglichkeit einer Finanzierung über die BMW Bank gehören zu unserem Service. Auf Wunsch organisieren wir DEKRA und TÜV direkt vor Ort. Inzahlungnahme Ihres Altfahrzeugs und Garantie-Optionen runden das Angebot ab.</p>
      <p>Viele unserer Gebrauchtwagen und Jahreswagen stammen aus Leasingrückläufern mit lückenloser Historie. So können Sie in Krefeld und Umgebung mit gutem Gewissen Ihr nächstes Auto finden – beim Autohaus GS Automobile Rheinland GmbH.</p>

      <h2>Service und Finanzierung für Kunden aus Krefeld und Umgebung</h2>
      <p>Ob Sie aus Krefeld, Düsseldorf, Neuss, Mönchengladbach, Duisburg, Moers, Meerbusch, Willich oder Kempen kommen: Wir beraten Sie persönlich zu Gebrauchtwagen, Jahreswagen, Finanzierung und Garantie. Besuchen Sie uns in Krefeld an der Kuhleshütte 149 oder nutzen Sie unsere Fahrzeugsuche online. Wir freuen uns auf Ihre Anfrage.</p>

      <h2>DEKRA, TÜV und Garantie beim Gebrauchtwagen-Kauf</h2>
      <p>Für maximale Sicherheit arbeiten wir mit DEKRA und TÜV Rheinland zusammen – viele Prüfungen finden direkt bei uns vor Ort statt. So erhalten Sie transparente Gutachten und können beruhigt Ihren Gebrauchtwagen oder Jahreswagen wählen. Optional bieten wir eine Gebrauchtwagengarantie mit 12 bis 24 Monaten Laufzeit. So sind Sie auch nach dem Kauf beim Autohaus GS Automobile Rheinland GmbH in Krefeld abgesichert.</p>

      <h2>Kontakt und Anfahrt zum Autohaus in Krefeld</h2>
      <p>Die GS Automobile Rheinland GmbH hat ihren Standort in Krefeld, Kuhleshütte 149, 47809 Krefeld. Wir sind von Montag bis Freitag sowie samstags für Sie da. Vereinbaren Sie einen Termin zur Probefahrt oder kommen Sie vorbei und überzeugen Sie sich von unserer Auswahl an Gebrauchtwagen und Jahreswagen. Wir freuen uns auf Ihren Besuch – ob aus Krefeld, Düsseldorf, Neuss, Mönchengladbach oder der weiteren Region am Niederrhein. Gern beantworten wir Ihre Fragen zu Finanzierung, Inzahlungnahme oder Garantie auch per Telefon oder E-Mail. Ihr Autohaus für Gebrauchtwagen in Krefeld – GS Automobile Rheinland GmbH.</p>
    </main>`,
  },
  "/fahrzeuge": {
    title: "Gebrauchtwagen Krefeld & Umgebung | Fahrzeugsuche | GS Automobile Rheinland",
    description:
      "Gebrauchtwagen in Krefeld, Düsseldorf, Neuss, Mönchengladbach, Duisburg, Moers, Meerbusch, Willich: BMW, Opel und mehr bei GS Automobile Rheinland. Große Auswahl, faire Preise. Jetzt Traumauto finden!",
    ogDescription: "Gebrauchtwagen bei GS Automobile Rheinland in Krefeld. Große Auswahl, faire Preise. Jetzt Traumauto finden!",
    canonical: BASE_URL + "/fahrzeuge",
    keywords:
      "Gebrauchtwagen Krefeld, Gebrauchtwagen Düsseldorf, Gebrauchtwagen Neuss, Gebrauchtwagen Mönchengladbach, Fahrzeugsuche, BMW Krefeld, Opel Krefeld, Autohaus Krefeld, GS Auto, Gebrauchtwagen kaufen",
    bodyContent: `
    <main class="seo-static-content" aria-label="Fahrzeugsuche">
      <h1>Gebrauchtwagen Krefeld & Umgebung</h1>
      <p>Hier finden Sie unsere aktuelle Auswahl an Gebrauchtwagen und Jahreswagen: BMW, Opel, Mini und weitere Marken. Nutzen Sie die Filter für Marke, Preis, Baujahr und Kraftstoff. Bei Fragen einfach anfragen oder vorbeikommen – wir beraten Sie gerne in Krefeld.</p>
      <p>GS Automobile Rheinland ist Ihr Autohaus am Niederrhein: geprüfte Qualität, faire Preise und persönliche Beratung. Ob Gebrauchtwagen oder Jahreswagen – wir betreuen Kunden aus Krefeld, Düsseldorf, Neuss, Mönchengladbach, Duisburg, Moers, Meerbusch und Willich. Finanzierung und DEKRA-Gutachten auf Wunsch.</p>
      <p>Unser Angebot umfasst unter anderem: BMW, Mini, Opel, Mercedes, Volkswagen, Ford und weitere Hersteller. Alle Fahrzeuge mit transparenten Angaben zu Kilometerstand, Ausstattung und Preis.</p>
    </main>`,
  },
  "/unternehmen": {
    title: "Unternehmen | GS Automobile Rheinland",
    description:
      "GS Automobile Rheinland: fair, transparent, effizient. Schneller Bestand, attraktive Marktpreise und geprüfte Qualität.",
    ogDescription: "GS Automobile Rheinland: fair, transparent, effizient. Geprüfte Gebrauchtwagen in Krefeld.",
    canonical: BASE_URL + "/unternehmen",
    keywords: "GS Automobile Rheinland, Autohaus Krefeld, Gebrauchtwagen Krefeld, DEKRA, Leasingrückläufer",
    bodyContent: `
    <main class="seo-static-content" aria-label="Unternehmen">
      <h1>Unternehmen</h1>
      <p>GS Automobile Rheinland steht für faire Preise, geprüfte Qualität und persönliche Beratung. Überwiegend Leasingrückläufer mit lückenloser Historie, DEKRA-Gutachten und attraktive Auswahl führender Hersteller – von der ersten Anfrage bis zur Schlüsselübergabe.</p>
    </main>`,
  },
  "/kontakt": {
    title: "Kontakt | GS Automobile Rheinland",
    description:
      "Kontaktieren Sie GS Automobile Rheinland in Krefeld. Beratung zu Fahrzeugen, Finanzierung und Inzahlungnahme. Telefon, E-Mail und Standort.",
    ogDescription: "Kontakt GS Automobile Rheinland in Krefeld. Beratung zu Fahrzeugen, Finanzierung und Inzahlungnahme.",
    canonical: BASE_URL + "/kontakt",
    keywords: "Kontakt Autohaus Krefeld, GS Automobile Rheinland, Telefon, E-Mail, Standort",
    bodyContent: `
    <main class="seo-static-content" aria-label="Kontakt">
      <h1>Kontakt</h1>
      <p>Sie haben Fragen zu Fahrzeugen, Finanzierung oder Inzahlungnahme? Wir beraten Sie gerne persönlich.</p>
      <p><strong>GS Automobile Rheinland GmbH</strong><br>Kuhleshütte 149<br>47809 Krefeld</p>
      <p>Telefon: 02151 94 222 62<br>E-Mail: info@gsauto.de</p>
    </main>`,
  },
};

function escapeMeta(s) {
  if (typeof s !== "string") return "";
  return s
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function getPathFromRequest(req) {
  const path = req.query?.path;
  if (path && typeof path === "string") return path.trim().replace(/\/+$/, "") || "/";
  if (Array.isArray(path) && path[0]) return String(path[0]).trim().replace(/\/+$/, "") || "/";
  try {
    const pathname = new URL(req.url || "", BASE_URL).pathname;
    // /api/page-html → path aus Query; falls URL-Pfad genutzt wird: /api/page-html/fahrzeuge
    const segments = pathname.split("/").filter(Boolean);
    if (segments[0] === "api" && segments[1] === "page-html" && segments[2])
      return "/" + segments.slice(2).join("/");
  } catch (_) {}
  return "/";
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).end();
  }

  const path = getPathFromRequest(req);
  const routePath = path === "" ? "/" : path;
  const config = ROUTE_CONFIG[routePath];
  if (!config) {
    return res.status(404).end();
  }

  // Für /fahrzeuge: Fahrzeugliste serverseitig laden und ins Pre-Render einbauen (SEO)
  let bodyContentToUse = config.bodyContent;
  /** Für JSON-LD ItemList (nur /fahrzeuge mit Fahrzeugen) */
  let vehiclesForSchema = [];
  /** Vollständige Liste für window.__PRELOADED_VEHICLES__ — Googlebot darf /api/ nicht; React braucht Hydration ohne fetch. */
  let vehiclesFullForPreload = [];
  if (routePath === "/fahrzeuge") {
    try {
      const vehiclesRes = await fetch(`${BACKEND_API}/api/vehicles`, {
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(8000),
      });
      if (vehiclesRes.ok) {
        const vehiclesData = await vehiclesRes.json().catch(() => null);
        const listRaw = vehiclesData?.data ?? (vehiclesData?.vehicles ?? []);
        const list = Array.isArray(listRaw) ? listRaw : [];
        vehiclesFullForPreload = list;
        const vehicles = list.slice(0, 80);
        vehiclesForSchema = vehicles;
        if (vehicles.length > 0) {
          const listItems = vehicles
            .map((v) => {
              const slug = getVehicleDetailSlug(v.id, v.brand, v.model);
              const title = [v.brand, v.model, v.year].filter(Boolean).join(" ") || slug;
              const priceStr = formatPrice(v.price);
              const kmStr = formatMileage(v.mileage);
              const fuelStr = (v.fuel || "").trim() || "–";
              const parts = [title, priceStr ? priceStr + " €" : "", kmStr, fuelStr].filter(Boolean);
              const label = parts.join(" · ");
              const safeLabel = escapeMeta(label);
              const href = `${BASE_URL}/fahrzeuge/${slug}`;
              return `<li><a href="${escapeMeta(href)}">${safeLabel}</a></li>`;
            })
            .join("\n          ");
          bodyContentToUse = config.bodyContent.replace(
            "</main>",
            `
      <section class="seo-static-content__section" aria-label="Aktuelle Gebrauchtwagen">
        <h2 class="seo-static-content__list-title">Aktuelle Gebrauchtwagen</h2>
        <ul class="seo-static-content__list">
          ${listItems}
        </ul>
      </section>
    </main>`
          );
        }
      }
    } catch (e) {
      // Fallback: nur statischer Intro-Text ohne Liste
    }
  }

  // JSON-LD für SEO: ItemList (Fahrzeugliste) + BreadcrumbList
  const jsonLdScripts = [];
  if (routePath === "/fahrzeuge" && vehiclesForSchema.length > 0) {
    const itemList = {
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: "Gebrauchtwagen bei GS Automobile Rheinland Krefeld",
      description: "Aktuelle Gebrauchtwagen und Jahreswagen: BMW, Opel, Mini und weitere Marken in Krefeld und Umgebung.",
      numberOfItems: vehiclesForSchema.length,
      itemListElement: vehiclesForSchema.map((v, i) => {
        const slug = getVehicleDetailSlug(v.id, v.brand, v.model);
        const name = [v.brand, v.model, v.year].filter(Boolean).join(" ") || slug;
        return {
          "@type": "ListItem",
          position: i + 1,
          name,
          url: `${BASE_URL}/fahrzeuge/${slug}`,
        };
      }),
    };
    jsonLdScripts.push(itemList);
  }
  if (routePath === "/fahrzeuge") {
    jsonLdScripts.push({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Startseite", item: { "@id": BASE_URL + "/" } },
        { "@type": "ListItem", position: 2, name: "Gebrauchtwagen", item: { "@id": BASE_URL + "/fahrzeuge" } },
      ],
    });
  }
  if (routePath === "/unternehmen") {
    jsonLdScripts.push({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Startseite", item: { "@id": BASE_URL + "/" } },
        { "@type": "ListItem", position: 2, name: "Unternehmen", item: { "@id": BASE_URL + "/unternehmen" } },
      ],
    });
  }

  // /index.html abrufen, damit die Middleware nicht erneut page-html für / liefert (Rekursion)
  let html;
  try {
    const r = await fetch(`${BASE_URL}/index.html`, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; GS-Auto-PageHTML/1.0)" },
    });
    if (!r.ok) throw new Error("Failed to fetch index");
    html = await r.text();
  } catch (e) {
    return res.status(502).send("Temporarily unavailable");
  }

  const safeTitle = escapeMeta(config.title);
  const safeDesc = escapeMeta(config.description);
  const safeOgDesc = escapeMeta(config.ogDescription ?? config.description);
  const safeCanonical = escapeMeta(config.canonical);

  // Styling für Pre-Render-Block (sieht vor React-Load wie die Website aus)
  const seoStaticStyles = `<style>
.seo-static-content{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;max-width:48rem;margin:0 auto;padding:2rem 1rem;line-height:1.6;color:#1e293b;}
.seo-static-content h1{font-size:1.75rem;font-weight:700;color:#1e5a9e;margin:0 0 1rem;letter-spacing:-0.02em;}
.seo-static-content p{margin:0 0 0.75rem;font-size:0.9375rem;color:#475569;}
.seo-static-content p:last-child{margin-bottom:0;}
.seo-static-content__section{margin-top:1.5rem;}
.seo-static-content__list-title{font-size:1.125rem;font-weight:600;color:#1e293b;margin:1.25rem 0 0.5rem;}
.seo-static-content__list{margin:0;padding-left:1.25rem;list-style:disc;}
.seo-static-content__list li{margin-bottom:0.25rem;}
.seo-static-content__list a{color:#1e5a9e;text-decoration:none;}
.seo-static-content__list a:hover{text-decoration:underline;}
</style>`;
  const jsonLdHtml =
    jsonLdScripts.length > 0
      ? jsonLdScripts
          .map(
            (obj) =>
              `<script type="application/ld+json">${JSON.stringify(obj).replace(/<\/script/gi, "<\\/script")}</script>`
          )
          .join("\n")
      : "";

  const safeKeywords = config.keywords ? escapeMeta(config.keywords) : null;
  // Head anpassen (Pre-Render-Text bleibt sichtbar im ersten HTML – Google indexiert nur zuverlässig, wenn Inhalt sichtbar ist; React ersetzt #root nach Load)
  html = html
    .replace(
      /<head>/,
      `<head>\n<link rel="canonical" href="${safeCanonical}" />\n<!-- page-html: ${escapeMeta(routePath)} -->\n${seoStaticStyles}\n${jsonLdHtml}`
    )
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${safeTitle}</title>`)
    .replace(
      /<meta name="description" content="[^"]*"/,
      `<meta name="description" content="${safeDesc}"`
    )
    .replace(
      /<link rel="canonical" href="[^"]*"/,
      `<link rel="canonical" href="${safeCanonical}"`
    )
    .replace(
      /<meta property="og:url" content="[^"]*"/,
      `<meta property="og:url" content="${safeCanonical}"`
    )
    .replace(
      /<meta property="og:title" content="[^"]*"/,
      `<meta property="og:title" content="${safeTitle}"`
    )
    .replace(
      /<meta property="og:description" content="[^"]*"/,
      `<meta property="og:description" content="${safeOgDesc}"`
    )
    .replace(
      /<meta name="twitter:title" content="[^"]*"/,
      `<meta name="twitter:title" content="${safeTitle}"`
    )
    .replace(
      /<meta name="twitter:description" content="[^"]*"/,
      `<meta name="twitter:description" content="${safeOgDesc}"`
    );
  if (safeKeywords) {
    html = html.replace(
      /<meta name="keywords" content="[^"]*"/,
      `<meta name="keywords" content="${safeKeywords}"`
    );
  }

  // Sichtbaren Content in #root injizieren (wird von React beim Mount ersetzt)
  const rootWithContent = `<div id="root">${bodyContentToUse}</div>`;
  html = html.replace(/<div id="root"\s*>\s*<\/div>/, rootWithContent);

  // Google rendert JS, ruft aber /api/vehicles nicht an (robots.txt). Wie vehicle-preview: Daten einbetten.
  if (routePath === "/fahrzeuge" && vehiclesFullForPreload.length > 0) {
    const preloadJson = JSON.stringify(vehiclesFullForPreload).replace(/</g, "\\u003c");
    const preloadBlock =
      `<script type="application/json" id="__PRELOADED_VEHICLES__">${preloadJson}</script>` +
      `<script>try{window.__PRELOADED_VEHICLES__=JSON.parse(document.getElementById("__PRELOADED_VEHICLES__").textContent);}catch(e){}</script>`;
    html = html.replace("</head>", `${preloadBlock}\n</head>`);
  }

  // Mit ?raw=1 nur Pre-Render anzeigen (kein React), z. B. zum Prüfen: /api/page-html?path=/fahrzeuge&raw=1
  const rawParam = req.query?.raw;
  const wantRaw =
    rawParam === "1" ||
    rawParam === "true" ||
    (Array.isArray(rawParam) && (rawParam[0] === "1" || rawParam[0] === "true"));
  if (wantRaw) {
    // Nur App-Bundle entfernen (script mit src=…/assets/…), nicht JSON-LD
    html = html.replace(/<script[\s\S]*?src="\/assets\/[^"]+\.js"[\s\S]*?><\/script>/gi, "<!-- React app removed for raw preview -->");
    html = html.replace(/<link[\s\S]*?href="\/assets\/[^"]+\.css"[\s\S]*?>/gi, "<!-- App CSS removed -->");
  }

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=300, s-maxage=300");
  res.setHeader("X-Page-HTML", "1");
  res.setHeader("X-Page-Path", routePath);
  res.status(200).send(html);
}
