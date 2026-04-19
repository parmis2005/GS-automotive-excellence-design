/**
 * Vercel Edge Middleware:
 * - /, /fahrzeuge, /fahrzeuge/marke/…, /fahrzeuge/typ/…, /unternehmen: page-html API für SEO / keine Soft-404
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

/** SEO-Landingpages Fahrzeugsuche – wie in App.tsx; brauchen page-html + Preload (Googlebot: /api/ blockiert). */
function isFahrzeugeSucheLandingPath(normalized) {
  const parts = normalized.split("/").filter(Boolean);
  if (parts.length === 3 && parts[0] === "fahrzeuge" && parts[1] === "marke") return true;
  if (parts.length === 4 && parts[0] === "fahrzeuge" && parts[1] === "marke") return true;
  if (parts.length === 3 && parts[0] === "fahrzeuge" && parts[1] === "typ") return true;
  return false;
}

const HTML_404 = `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="robots" content="noindex, nofollow" />
  <title>Seite nicht gefunden (404) | GS Automobile Rheinland</title>
  <link rel="canonical" href="${BASE_URL}/" />
  <link rel="icon" type="image/png" href="/favicon.png" />
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif;
      background: #f1f5f9;
      color: #1e293b;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2rem 1rem;
      line-height: 1.6;
    }
    .wrap {
      width: 100%;
      max-width: 420px;
      text-align: center;
      background: #fff;
      border-radius: 0.5rem;
      box-shadow: 0 4px 24px rgba(0,0,0,0.08);
      padding: 2.5rem 2rem;
    }
    .logo { display: block; margin-bottom: 2rem; }
    .logo img { height: 40px; width: auto; display: block; margin: 0 auto; }
    .code {
      font-size: 4rem;
      font-weight: 700;
      color: #1e5a9e;
      line-height: 1;
      margin-bottom: 0.5rem;
      letter-spacing: -0.02em;
    }
    h1 {
      font-size: 1.35rem;
      font-weight: 600;
      margin: 0 0 0.75rem;
      color: #1e293b;
    }
    .text {
      font-size: 0.95rem;
      color: #64748b;
      margin: 0 0 1.75rem;
    }
    .links { display: flex; flex-wrap: wrap; gap: 0.75rem; justify-content: center; }
    .btn {
      display: inline-block;
      padding: 0.65rem 1.25rem;
      border-radius: 0.5rem;
      font-size: 0.9rem;
      font-weight: 500;
      text-decoration: none;
      transition: background 0.2s, color 0.2s;
    }
    .btn-primary {
      background: #1e5a9e;
      color: #fff;
    }
    .btn-primary:hover { background: #16467a; color: #fff; }
    .btn-outline {
      background: transparent;
      color: #1e5a9e;
      border: 1px solid #1e5a9e;
    }
    .btn-outline:hover { background: #eef4fc; }
  </style>
</head>
<body>
  <div class="wrap">
    <a href="${BASE_URL}/" class="logo" aria-label="GS Automobile Rheinland Startseite">
      <img src="${BASE_URL}/logo.png" alt="GS Automobile Rheinland" width="160" height="40" />
    </a>
    <div class="code">404</div>
    <h1>Seite nicht gefunden</h1>
    <p class="text">Die angeforderte Seite existiert nicht. Möglicherweise wurde sie verschoben oder die Adresse ist fehlerhaft.</p>
    <div class="links">
      <a href="${BASE_URL}/" class="btn btn-primary">Zur Startseite</a>
      <a href="${BASE_URL}/fahrzeuge" class="btn btn-outline">Zu den Gebrauchtwagen</a>
    </div>
  </div>
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

  // SEO-Landingpages für Fahrzeugsuche:
  // - /fahrzeuge/marke/:marke
  // - /fahrzeuge/marke/:marke/:modell
  // - /fahrzeuge/typ/:typ
  const parts = normalized.split("/").filter(Boolean);
  if (parts.length === 3 && parts[0] === "fahrzeuge" && parts[1] === "marke") return true;
  if (parts.length === 4 && parts[0] === "fahrzeuge" && parts[1] === "marke") return true;
  if (parts.length === 3 && parts[0] === "fahrzeuge" && parts[1] === "typ") return true;

  // /fahrzeuge/:slug (genau ein Segment)
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

  // Fahrzeugsuche-Landingpages: /fahrzeuge/marke/…, /fahrzeuge/typ/… (Preload wie /fahrzeuge)
  if (isFahrzeugeSucheLandingPath(normalized)) {
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
