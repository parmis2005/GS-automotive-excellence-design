/**
 * Vercel Serverless Function: returns index.html with vehicle-specific Open Graph
 * meta tags so crawlers (WhatsApp, Facebook, etc.) show the correct preview.
 * Used via vercel.json rewrite: /fahrzeuge/:slug → this function.
 *
 * Wichtig: gsauto.de muss in diesem Vercel-Projekt als Production-Domain eingetragen
 * sein, damit die Rewrites greifen. Sonst liefert der alte Host weiter die gleiche
 * index.html für alle URLs.
 */
export const config = { maxDuration: 25 };

const BASE_URL = "https://gsauto.de";

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

function ensureAbsoluteImageUrl(image) {
  if (!image || !image.trim()) return `${BASE_URL}/logo.png`;
  let url = image.startsWith("http") ? image : `${BASE_URL}${image}`;
  if (url.includes("cargate360")) url = url.replace(/format=[^&]*/i, "format=xl");
  if (url.includes("carzilla-services.com")) url = url.replace(/format=[^&]*/i, "format=l");
  return url;
}

function getSlugFromRequest(req) {
  const fromQuery = req.query?.slug;
  if (fromQuery && typeof fromQuery === "string") return fromQuery;
  if (Array.isArray(fromQuery) && fromQuery[0]) return fromQuery[0];
  try {
    const pathname = new URL(req.url || "", BASE_URL).pathname;
    const segments = pathname.split("/").filter(Boolean);
    // Nach Rewrite: /api/vehicle-preview/8879641-bmw-320i
    if (segments[0] === "api" && segments[1] === "vehicle-preview" && segments[2])
      return segments[2];
    // Original-URL (falls Rewrite-URL übergeben wird): /fahrzeuge/8879641-bmw-320i
    if (segments[0] === "fahrzeuge" && segments[1]) return segments[1];
  } catch (_) {}
  return "";
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).end();
  }

  const slug = getSlugFromRequest(req);
  const vehicleId = getVehicleIdFromSlug(slug);
  if (!vehicleId) {
    return res.redirect(302, "/fahrzeuge");
  }

  // Immer Production-URL nutzen, damit Fetches dieselbe Domain treffen (gsauto.de)
  const origin = BASE_URL;

  let vehicle;
  try {
    const r = await fetch(`${origin}/api/vehicles/${vehicleId}`, {
      headers: { "User-Agent": "GS-Auto-Vehicle-Preview/1.0" },
    });
    if (!r.ok) {
      return res.redirect(302, "/fahrzeuge");
    }
    const data = await r.json();
    vehicle = data.data ?? data;
  } catch (e) {
    return res.redirect(302, "/fahrzeuge");
  }

  const brand = vehicle.brand ?? "";
  const model = vehicle.model ?? "";
  const year = Number(vehicle.year) || new Date().getFullYear();
  const price = Number(vehicle.price) || 0;
  const mileage = Number(vehicle.mileage) || 0;
  const fuel = (vehicle.fuel ?? "").trim() || "–";
  const powerKw = Number(vehicle.powerKw) || 0;
  const powerPs = Number(vehicle.power) || 0;
  const image = ensureAbsoluteImageUrl(vehicle.image);
  const detailPath = `/fahrzeuge/${slug}`;
  const fullUrl = `${BASE_URL}${detailPath}`;

  // mobile.de-Stil: "Ford Mustang für 14.990 €" / "Gebrauchtfahrzeug • 133.500 km • 228 kW (310 PS) • Benzin..."
  const priceStr = price > 0 ? price.toLocaleString("de-DE") : "";
  const title = priceStr
    ? `${brand} ${model} für ${priceStr} €`
    : `${brand} ${model} ${year} | Gebrauchtwagen`;
  const parts = ["Gebrauchtfahrzeug"];
  if (mileage > 0) parts.push(`${mileage.toLocaleString("de-DE")} km`);
  if (powerKw > 0 && powerPs > 0) parts.push(`${powerKw} kW (${powerPs} PS)`);
  else if (powerKw > 0) parts.push(`${powerKw} kW`);
  else if (powerPs > 0) parts.push(`${powerPs} PS`);
  if (fuel && fuel !== "–") parts.push(fuel);
  const description = parts.join(" • ");

  let html;
  try {
    const r = await fetch(`${origin}/`, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; GS-Auto-Fetch/1.0)" },
    });
    if (!r.ok) throw new Error("Failed to fetch index");
    html = await r.text();
  } catch (e) {
    return res.redirect(302, "/fahrzeuge");
  }

  const safeTitle = escapeMeta(title);
  const safeDesc = escapeMeta(description);

  html = html
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${safeTitle}</title>`)
    .replace(
      /<meta name="description" content="[^"]*"/,
      `<meta name="description" content="${safeDesc}"`
    )
    .replace(
      /<link rel="canonical" href="[^"]*"/,
      `<link rel="canonical" href="${fullUrl}"`
    )
    .replace(
      /<meta property="og:type" content="[^"]*"/,
      '<meta property="og:type" content="product"'
    )
    .replace(
      /<meta property="og:url" content="[^"]*"/,
      `<meta property="og:url" content="${fullUrl}"`
    )
    .replace(
      /<meta property="og:title" content="[^"]*"/,
      `<meta property="og:title" content="${safeTitle}"`
    )
    .replace(
      /<meta property="og:description" content="[^"]*"/,
      `<meta property="og:description" content="${safeDesc}"`
    )
    .replace(
      /<meta property="og:image" content="[^"]*"/,
      `<meta property="og:image" content="${image}"`
    )
    .replace(
      /<meta property="og:image:alt" content="[^"]*"/,
      `<meta property="og:image:alt" content="${escapeMeta(`${brand} ${model} ${year}`)}"`
    )
    .replace(
      /<meta name="twitter:card" content="[^"]*"/,
      '<meta name="twitter:card" content="summary_large_image"'
    )
    .replace(
      /<meta name="twitter:title" content="[^"]*"/,
      `<meta name="twitter:title" content="${safeTitle}"`
    )
    .replace(
      /<meta name="twitter:description" content="[^"]*"/,
      `<meta name="twitter:description" content="${safeDesc}"`
    )
    .replace(
      /<meta name="twitter:image" content="[^"]*"/,
      `<meta name="twitter:image" content="${image}"`
    );

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=300, s-maxage=300");
  res.status(200).send(html);
}
