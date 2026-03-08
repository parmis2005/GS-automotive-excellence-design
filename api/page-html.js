/**
 * Vercel Serverless Function: Liefert vorgerendertes HTML für wichtige Routen
 * (/, /fahrzeuge, /unternehmen), damit Google im initialen HTML sichtbaren
 * Content sieht und keine Soft-404 meldet. React ersetzt #root-Inhalt beim Mount.
 */
export const config = { maxDuration: 15 };

const BASE_URL = "https://gsauto.de";

const ROUTE_CONFIG = {
  "/": {
    title: "GS Automobile Rheinland GmbH | Autohaus in Krefeld – Gebrauchtwagen, BMW, Opel",
    description:
      "GS Automobile Rheinland GmbH: Autohaus mit Standort in Krefeld – Kunden aus Düsseldorf, Neuss, Mönchengladbach, Duisburg, Moers, Meerbusch, Willich und Umgebung. Gebrauchtwagen, BMW, Opel. Finanzierung, DEKRA, Garantie. GS Auto am Niederrhein.",
    ogDescription: "Gebrauchtwagen, BMW und Opel in Krefeld. Finanzierung, DEKRA, Garantie. GS Automobile Rheinland.",
    canonical: BASE_URL + "/",
    bodyContent: `
    <main class="seo-static-content" aria-label="Inhalt">
      <h1>GS Automobile Rheinland – Autohaus in Krefeld</h1>
      <p>Ihr Ansprechpartner für Gebrauchtwagen, Jahreswagen, BMW und Opel am Niederrhein. Wir betreuen Kunden aus Krefeld, Düsseldorf, Neuss, Mönchengladbach, Duisburg, Moers, Meerbusch und Willich. Finanzierung, DEKRA-Gutachten und Garantie – fair und transparent.</p>
    </main>`,
  },
  "/fahrzeuge": {
    title: "Gebrauchtwagen Krefeld & Umgebung | Fahrzeugsuche | GS Automobile Rheinland",
    description:
      "Gebrauchtwagen in Krefeld, Düsseldorf, Neuss, Mönchengladbach, Duisburg, Moers, Meerbusch, Willich: BMW, Opel und mehr bei GS Automobile Rheinland. Große Auswahl, faire Preise. Jetzt Traumauto finden!",
    ogDescription: "Gebrauchtwagen bei GS Automobile Rheinland in Krefeld. Große Auswahl, faire Preise. Jetzt Traumauto finden!",
    canonical: BASE_URL + "/fahrzeuge",
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
    bodyContent: `
    <main class="seo-static-content" aria-label="Unternehmen">
      <h1>Unternehmen</h1>
      <p>GS Automobile Rheinland steht für faire Preise, geprüfte Qualität und persönliche Beratung. Überwiegend Leasingrückläufer mit lückenloser Historie, DEKRA-Gutachten und attraktive Auswahl führender Hersteller – von der ersten Anfrage bis zur Schlüsselübergabe.</p>
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
</style>`;

  // Head anpassen (Pre-Render-Text bleibt sichtbar im ersten HTML – Google indexiert nur zuverlässig, wenn Inhalt sichtbar ist; React ersetzt #root nach Load)
  html = html
    .replace(/<head>/, `<head>\n<!-- page-html: ${escapeMeta(routePath)} -->\n${seoStaticStyles}`)
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

  // Sichtbaren Content in #root injizieren (wird von React beim Mount ersetzt)
  const rootWithContent = `<div id="root">${config.bodyContent}</div>`;
  html = html.replace(/<div id="root"\s*>\s*<\/div>/, rootWithContent);

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=300, s-maxage=300");
  res.setHeader("X-Page-HTML", "1");
  res.setHeader("X-Page-Path", routePath);
  res.status(200).send(html);
}
