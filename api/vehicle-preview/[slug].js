/**
 * Vercel Serverless Function: Liefert für /fahrzeuge/:slug vollständiges HTML
 * mit Meta-Tags UND sichtbarem Fahrzeuginhalt im Body (SEO, keine Soft-404).
 * Google sieht H1, Preis, Daten, Beschreibung und Bild ohne clientseitigen Fetch.
 *
 * - Fahrzeugdaten: Direkt vom Backend (BACKEND_API), mit Retry – kein Aufruf über
 *   gsauto.de (vermeidet 499 Client Closed Request / Timeouts).
 * - Fahrzeug nicht gefunden → HTTP 404 (kein 200 mit Fehlerbox).
 * - Backend nicht erreichbar nach Retry → HTTP 503 (kein 200 mit Fehlerbox).
 */
export const config = { maxDuration: 25 };

const BASE_URL = "https://gsauto.de";
const BACKEND_API = "http://209.38.251.38:3001";

const FETCH_TIMEOUT_MS = 10000;
const RETRIES = 2;

function escapeMeta(s) {
  if (typeof s !== "string") return "";
  return s
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function getVehicleIdFromSlug(slug) {
  if (!slug || typeof slug !== "string") return "";
  const segment = slug.trim().split("-")[0];
  return segment || "";
}

function formatPrice(price) {
  const n = Number(price);
  if (!Number.isFinite(n) || n <= 0) return "";
  return Math.round(n).toLocaleString("de-DE", { maximumFractionDigits: 0, minimumFractionDigits: 0 });
}

/** Wie src/utils/seo.ts truncateSeoDescription – Meta-Länge begrenzen. */
function truncateSeoDescription(text, max = 300) {
  const t = String(text || "").trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > 40 ? cut.slice(0, lastSpace) : cut).trimEnd() + "…";
}

function ensureAbsoluteImageUrl(image, vehicleId) {
  if (image && image.trim()) {
    let url = image.startsWith("http") ? image : `${BASE_URL}${image}`;
    if (url.includes("cargate360")) url = url.replace(/format=[^&]*/i, "format=xl");
    if (url.includes("carzilla-services.com")) url = url.replace(/format=[^&]*/i, "format=l");
    return url;
  }
  if (vehicleId && String(vehicleId).trim()) {
    return `https://img.cargate360.de/default.aspx?vid=${encodeURIComponent(String(vehicleId).trim())}&bid=1790&format=xl&ino=1&app=Kiste-Default`;
  }
  return `${BASE_URL}/logo.png`;
}

function getSlugFromRequest(req) {
  const fromQuery = req.query?.slug;
  if (fromQuery && typeof fromQuery === "string") return fromQuery;
  if (Array.isArray(fromQuery) && fromQuery[0]) return fromQuery[0];
  try {
    const pathname = new URL(req.url || "", BASE_URL).pathname;
    const segments = pathname.split("/").filter(Boolean);
    if (segments[0] === "api" && segments[1] === "vehicle-preview" && segments[2]) return segments[2];
    if (segments[0] === "fahrzeuge" && segments[1]) return segments[1];
  } catch (_) {}
  return "";
}

/** Fetch mit Timeout und Retries (nur bei Netzwerkfehlern/5xx). */
async function fetchWithRetry(url, options = {}) {
  const { retries = RETRIES, timeout = FETCH_TIMEOUT_MS } = options;
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), timeout);
      const r = await fetch(url, {
        ...options,
        signal: ctrl.signal,
        headers: {
          "User-Agent": "GS-Auto-Vehicle-Preview/1.0",
          "Accept": "application/json",
          ...options.headers,
        },
      });
      clearTimeout(t);
      if (r.status === 404) return r;
      if (r.ok) return r;
      if (r.status >= 500 && attempt < retries) {
        lastError = new Error(`Backend ${r.status}`);
        continue;
      }
      return r;
    } catch (e) {
      lastError = e;
      if (attempt < retries) continue;
      throw lastError;
    }
  }
  throw lastError;
}

/** HTML für 404 (Fahrzeug existiert nicht). */
function html404(slug) {
  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="robots" content="noindex, nofollow" />
  <title>Fahrzeug nicht gefunden | GS Automobile Rheinland</title>
  <link rel="canonical" href="${BASE_URL}/fahrzeuge" />
  <link rel="icon" type="image/png" href="/favicon.png" />
  <style>body{font-family:system-ui,sans-serif;max-width:32rem;margin:2rem auto;padding:0 1rem;color:#1e293b;} h1{font-size:1.25rem;color:#1e5a9e;} a{color:#1e5a9e;}</style>
</head>
<body>
  <h1>Fahrzeug nicht gefunden</h1>
  <p>Das angeforderte Fahrzeug existiert nicht oder wurde entfernt.</p>
  <p><a href="${BASE_URL}/fahrzeuge">Zur Fahrzeugsuche</a></p>
</body>
</html>`;
}

/** HTML für 503 (Backend nicht erreichbar). */
function html503() {
  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="robots" content="noindex, nofollow" />
  <title>Vorübergehend nicht verfügbar | GS Automobile Rheinland</title>
  <link rel="canonical" href="${BASE_URL}/fahrzeuge" />
  <style>body{font-family:system-ui,sans-serif;max-width:32rem;margin:2rem auto;padding:0 1rem;color:#1e293b;} h1{font-size:1.25rem;} a{color:#1e5a9e;}</style>
</head>
<body>
  <h1>Vorübergehend nicht verfügbar</h1>
  <p>Die Fahrzeugdaten sind derzeit nicht abrufbar. Bitte versuchen Sie es später erneut.</p>
  <p><a href="${BASE_URL}/fahrzeuge">Zur Fahrzeugsuche</a></p>
</body>
</html>`;
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).end();
  }

  const slug = getSlugFromRequest(req);
  const vehicleId = getVehicleIdFromSlug(slug);
  if (!vehicleId) {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("X-Vehicle-Preview", "invalid-slug");
    return res.status(404).send(html404(slug || ""));
  }

  let vehicle;
  let resVehicle = null;
  try {
    resVehicle = await fetchWithRetry(`${BACKEND_API}/api/vehicles/${vehicleId}`, {
      retries: RETRIES,
      timeout: FETCH_TIMEOUT_MS,
    });
    if (resVehicle.status === 404) {
      console.warn("[vehicle-preview] Vehicle not found:", vehicleId, "slug:", slug);
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.setHeader("X-Vehicle-Preview", "not-found");
      return res.status(404).send(html404(slug));
    }
    if (!resVehicle.ok) {
      console.error("[vehicle-preview] Backend error:", resVehicle.status, vehicleId);
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.setHeader("Retry-After", "60");
      return res.status(503).send(html503());
    }
    const data = await resVehicle.json().catch(() => null);
    vehicle = data?.data ?? data;
    if (!vehicle || !vehicle.id) {
      console.warn("[vehicle-preview] Empty vehicle data for id:", vehicleId);
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.setHeader("X-Vehicle-Preview", "not-found");
      return res.status(404).send(html404(slug));
    }
  } catch (e) {
    console.error("[vehicle-preview] Fetch failed:", vehicleId, e?.message || String(e));
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Retry-After", "60");
    return res.status(503).send(html503());
  }

  const brand = vehicle.brand ?? "";
  const model = vehicle.model ?? "";
  const year = Number(vehicle.year) || new Date().getFullYear();
  const price = Number(vehicle.price) || 0;
  const mileage = Number(vehicle.mileage) || 0;
  const fuel = (vehicle.fuel ?? "").trim() || "–";
  const powerKw = Number(vehicle.powerKw) || 0;
  const powerPs = Number(vehicle.power) || 0;
  const description = (vehicle.description ?? "").trim();
  const image = ensureAbsoluteImageUrl(vehicle.image, vehicleId);
  const detailPath = `/fahrzeuge/${slug}`;
  const fullUrl = `${BASE_URL}${detailPath}`;

  const priceStr = formatPrice(price);
  const title = priceStr
    ? `${brand} ${model} für ${priceStr} € in Krefeld | GS Automobile Rheinland`
    : `${brand} ${model} ${year} · Gebrauchtwagen Krefeld | GS Automobile Rheinland`;

  const specParts = [];
  if (mileage > 0) specParts.push(`${mileage.toLocaleString("de-DE")} km`);
  if (powerKw > 0 && powerPs > 0) specParts.push(`${powerKw} kW (${powerPs} PS)`);
  else if (powerKw > 0) specParts.push(`${powerKw} kW`);
  else if (powerPs > 0) specParts.push(`${powerPs} PS`);
  if (fuel && fuel !== "–") specParts.push(fuel);
  const specText = specParts.join(" · ");

  let metaDescription = truncateSeoDescription(
    specText.length > 0
      ? `${brand} ${model} (${year}) als Gebrauchtwagen in Krefeld: ${specText}. Persönliche Beratung bei GS Automobile Rheinland.`
      : `${brand} ${model} (${year}) – Gebrauchtwagen in Krefeld. GS Automobile Rheinland.`
  );

  const ogDescription = truncateSeoDescription(
    specText.length > 0 ? `${brand} ${model} in Krefeld · ${specText}` : `${brand} ${model} · Gebrauchtwagen Krefeld`,
    200
  );

  const shortDesc =
    description.trim().length > 0
      ? truncateSeoDescription(
          `Gebrauchtwagen in Krefeld (${brand} ${model}, ${year}): ${description.replace(/\s+/g, " ").trim()}`,
          400
        )
      : metaDescription;

  const vehicleBodyContent = `
    <main class="seo-static-content vehicle-preview-content" aria-label="Fahrzeugdetails">
      <h1>${escapeMeta(`${brand} ${model} ${year}`)}</h1>
      <p class="seo-static-content__price" aria-label="Preis">${priceStr ? `${priceStr} €` : "Preis auf Anfrage"}</p>
      <dl class="seo-static-content__specs">
        <dt>Erstzulassung</dt><dd>${escapeMeta(String(year))}</dd>
        <dt>Kilometerstand</dt><dd>${escapeMeta(mileage > 0 ? mileage.toLocaleString("de-DE") + " km" : "–")}</dd>
        <dt>Kraftstoff</dt><dd>${escapeMeta(fuel)}</dd>
        ${powerKw > 0 || powerPs > 0 ? `<dt>Leistung</dt><dd>${escapeMeta(powerKw > 0 && powerPs > 0 ? `${powerKw} kW (${powerPs} PS)` : powerKw > 0 ? `${powerKw} kW` : `${powerPs} PS`)}</dd>` : ""}
      </dl>
      <figure class="seo-static-content__figure">
        <img src="${escapeMeta(image)}" alt="${escapeMeta(`${brand} ${model} ${year}`)}" width="800" height="600" loading="eager" />
      </figure>
      <section class="seo-static-content__description" aria-label="Beschreibung">
        <h2 class="seo-static-content__h2">Beschreibung</h2>
        <p>${escapeMeta(shortDesc)}</p>
      </section>
      <p><a href="${BASE_URL}/fahrzeuge">Weitere Gebrauchtwagen</a></p>
    </main>`;

  const transmission = (vehicle.transmission ?? "").trim() || null;
  const color = (vehicle.exteriorColor ?? "").trim() || null;

  const vehicleSchema = {
    "@context": "https://schema.org",
    "@type": "Car",
    name: `${brand} ${model}`,
    image,
    description: metaDescription,
    brand: { "@type": "Brand", name: brand },
    manufacturer: { "@type": "Organization", name: brand },
    model,
    productionDate: String(year),
    fuelType: fuel,
    ...(transmission ? { vehicleTransmission: transmission } : {}),
    ...(color ? { color } : {}),
    mileageFromOdometer: { "@type": "QuantitativeValue", value: mileage, unitCode: "KMT" },
    offers: {
      "@type": "Offer",
      price,
      priceCurrency: "EUR",
      availability: "https://schema.org/InStock",
      url: fullUrl,
      seller: { "@type": "Organization", name: "GS Automobile Rheinland" },
    },
    additionalProperty: [
      { "@type": "PropertyValue", name: "Baujahr", value: String(year) },
    ],
  };
  const jsonLdScript = `<script type="application/ld+json">${JSON.stringify(vehicleSchema).replace(/<\/script/gi, "<\\/script")}</script>`;

  // Fahrzeugdaten für Hydration: React braucht keinen /api/vehicles-Request (wichtig bei robots.txt Disallow: /api/)
  const preloadJson = JSON.stringify(vehicle).replace(/<\/script/gi, "\\u003c/script");
  const preloadScript =
    `<script type="application/json" id="__PRELOADED_VEHICLE__">${preloadJson}</script>` +
    `<script>try{window.__PRELOADED_VEHICLE__=JSON.parse(document.getElementById("__PRELOADED_VEHICLE__").textContent);}catch(e){}</script>`;

  const seoStyles = `<style>
.seo-static-content{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;max-width:48rem;margin:0 auto;padding:2rem 1rem;line-height:1.6;color:#1e293b;}
.seo-static-content h1{font-size:1.75rem;font-weight:700;color:#1e5a9e;margin:0 0 0.5rem;}
.seo-static-content__price{font-size:1.5rem;font-weight:600;color:#1e293b;margin:0 0 1rem;}
.seo-static-content__specs{margin:0 0 1rem;display:grid;grid-template-columns:auto 1fr;gap:0.25rem 1.5rem;}
.seo-static-content__specs dt{color:#64748b;} .seo-static-content__specs dd{margin:0;}
.seo-static-content__figure{margin:0 0 1rem;}
.seo-static-content__figure img{max-width:100%;height:auto;border-radius:0.5rem;}
.seo-static-content__h2{font-size:1.125rem;font-weight:600;margin:0 0 0.5rem;}
.seo-static-content__description p{margin:0;color:#475569;}
.seo-static-content a{color:#1e5a9e;text-decoration:none;}
.seo-static-content a:hover{text-decoration:underline;}
</style>`;

  let html;
  try {
    const r = await fetch(`${BASE_URL}/index.html`, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; GS-Auto-Fetch/1.0)" },
      signal: AbortSignal.timeout(8000),
    });
    if (!r.ok) throw new Error("Failed to fetch index");
    html = await r.text();
  } catch (e) {
    console.error("[vehicle-preview] Index fetch failed:", e?.message);
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Retry-After", "60");
    return res.status(503).send(html503());
  }

  const safeTitle = escapeMeta(title);
  const safeDesc = escapeMeta(metaDescription);
  const safeOgDesc = escapeMeta(ogDescription);

  html = html
    .replace(/<head>/, `<head>\n<!-- vehicle-preview: ${escapeMeta(slug)} -->\n${seoStyles}\n${jsonLdScript}\n${preloadScript}`)
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${safeTitle}</title>`)
    .replace(/<meta name="description" content="[^"]*"/, `<meta name="description" content="${safeDesc}"`)
    .replace(/<link rel="canonical" href="[^"]*"/, `<link rel="canonical" href="${fullUrl}"`)
    .replace(/<meta property="og:type" content="[^"]*"/, '<meta property="og:type" content="product"')
    .replace(/<meta property="og:url" content="[^"]*"/, `<meta property="og:url" content="${fullUrl}"`)
    .replace(/<meta property="og:title" content="[^"]*"/, `<meta property="og:title" content="${safeTitle}"`)
    .replace(/<meta property="og:description" content="[^"]*"/, `<meta property="og:description" content="${safeOgDesc}"`)
    .replace(/<meta property="og:image" content="[^"]*"/, `<meta property="og:image" content="${image}"`)
    .replace(/<meta property="og:image:alt" content="[^"]*"/, `<meta property="og:image:alt" content="${escapeMeta(`${brand} ${model} ${year}`)}"`)
    .replace(/<meta name="twitter:card" content="[^"]*"/, '<meta name="twitter:card" content="summary_large_image"')
    .replace(/<meta name="twitter:title" content="[^"]*"/, `<meta name="twitter:title" content="${safeTitle}"`)
    .replace(/<meta name="twitter:description" content="[^"]*"/, `<meta name="twitter:description" content="${safeOgDesc}"`)
    .replace(/<meta name="twitter:image" content="[^"]*"/, `<meta name="twitter:image" content="${image}"`);

  const rootWithContent = `<div id="root">${vehicleBodyContent}</div>`;
  html = html.replace(/<div id="root"\s*>\s*<\/div>/, rootWithContent);

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=300, s-maxage=300");
  res.setHeader("X-Vehicle-Preview", "1");
  res.setHeader("X-Vehicle-Slug", slug);
  res.setHeader("X-Vehicle-Id", vehicleId);
  res.status(200).send(html);
}
