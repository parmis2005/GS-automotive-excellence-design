/**
 * Vercel Edge Middleware:
 * - /, /fahrzeuge, /unternehmen: vorgerendertes HTML (page-html API) für SEO / keine Soft-404
 * - /fahrzeuge/:slug: vehicle-preview API (Link-Vorschau)
 * - Ungültige Pfade: HTTP 404 mit 404-Seite
 * - API/Assets: durchreichen
 */
import { next } from "@vercel/functions";

const BASE_URL = "https://gsauto.de";

/** Bekannte SPA-Routen (ohne Pre-Rendering), die mit 200 und index.html bedient werden */
const VALID_SPA_PATHS = new Set([
  "/",
  "/fahrzeuge",
  "/unternehmen",
  "/impressum",
  "/datenschutz",
  "/haftungsausschluss",
  "/finanzierung",
  "/garantie",
  "/zulassung",
  "/dekra-tuev",
  "/oelwechsel",
  "/fahrzeugankauf",
  "/kontakt-erfolgreich",
]);

/** Pfade, die vorgerendertes HTML bekommen (page-html API) */
const PRERENDER_PATHS = new Set(["/", "/fahrzeuge", "/unternehmen"]);

const HTML_404 = `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="robots" content="noindex, nofollow" />
  <title>Seite nicht gefunden (404) | GS Automobile Rheinland</title>
  <link rel="canonical" href="${BASE_URL}/" />
  <link rel="icon" type="image/png" href="/favicon.png" />
  <style>body{font-family:system-ui,sans-serif;margin:2rem;max-width:600px;line-height:1.5}h1{font-size:1.5rem}a{color:#0f172a}</style>
</head>
<body>
  <h1>Seite nicht gefunden</h1>
  <p>Die angeforderte Seite existiert nicht.</p>
  <p><a href="${BASE_URL}/">Zur Startseite</a> · <a href="${BASE_URL}/fahrzeuge">Zu den Gebrauchtwagen</a></p>
</body>
</html>`;

export const config = {
  // Alle Dokument-Pfade (API/Assets in Middleware überspringen)
  matcher: ["/", "/:path*"],
};

function isVehicleSlug(segment) {
  return /^\d+[-a-z0-9]*$/i.test(segment);
}

function isValidPath(pathname) {
  const normalized = pathname.replace(/\/+$/, "") || "/";
  if (VALID_SPA_PATHS.has(normalized)) return true;
  if (normalized === "/fahrzeuge") return true;
  // /fahrzeuge/:slug (genau ein Segment)
  const parts = normalized.split("/").filter(Boolean);
  if (parts.length === 2 && parts[0] === "fahrzeuge" && isVehicleSlug(parts[1])) return true;
  return false;
}

export default async function middleware(request) {
  const url = new URL(request.url);
  const pathname = url.pathname;

  // API, Assets und Dateien mit Endung (z. B. sitemap.xml, favicon.png) durchreichen
  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/assets/") ||
    /\.[a-z0-9]+$/i.test(pathname)
  ) {
    return next();
  }

  const normalized = pathname.replace(/\/+$/, "") || "/";

  // Pre-Rendering: /, /fahrzeuge, /unternehmen
  if (PRERENDER_PATHS.has(normalized)) {
    const apiUrl = new URL("/api/page-html", request.url);
    apiUrl.searchParams.set("path", normalized);
    const res = await fetch(apiUrl, { method: "GET", headers: { Accept: "text/html" } });
    const html = await res.text();
    const headers = new Headers(res.headers);
    headers.set("Content-Type", "text/html; charset=utf-8");
    headers.set("X-Page-HTML", "1");
    return new Response(html, { status: res.status, headers });
  }

  // Fahrzeug-Detail: /fahrzeuge/:slug
  if (pathname.startsWith("/fahrzeuge/")) {
    const slug = pathname.slice("/fahrzeuge/".length).split("/")[0];
    if (slug && isVehicleSlug(slug)) {
      const apiUrl = new URL(`/api/vehicle-preview/${slug}`, request.url);
      const res = await fetch(apiUrl, { method: "GET", headers: { Accept: "text/html" } });
      const html = await res.text();
      const headers = new Headers(res.headers);
      headers.set("Content-Type", "text/html; charset=utf-8");
      headers.set("X-Vehicle-Preview", "1");
      headers.set("X-Vehicle-Slug", slug);
      return new Response(html, { status: res.status, headers });
    }
  }

  // Ungültige Pfade → 404 (serverseitig)
  if (!isValidPath(pathname)) {
    return new Response(HTML_404, {
      status: 404,
      headers: { "Content-Type": "text/html; charset=utf-8", "X-Robots-Tag": "noindex, nofollow" },
    });
  }

  return next();
}
