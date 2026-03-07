/**
 * Vercel Edge Middleware: Für /fahrzeuge/:slug wird die vehicle-preview API
 * direkt aufgerufen und die Antwort zurückgegeben (Proxy). So funktioniert
 * die Link-Vorschau auch, wenn vercel.json-Rewrites nicht greifen.
 */
import { next } from "@vercel/functions";

export const config = {
  matcher: ["/fahrzeuge/:path*"],
};

export default async function middleware(request) {
  const url = new URL(request.url);
  const pathname = url.pathname;
  const prefix = "/fahrzeuge/";
  if (!pathname.startsWith(prefix) || pathname === "/fahrzeuge") {
    return next();
  }
  const slug = pathname.slice(prefix.length).split("/")[0];
  if (!slug) return next();

  // API direkt aufrufen und Antwort durchreichen (Rewrite wird oft nicht angewendet)
  const apiUrl = new URL(`/api/vehicle-preview/${slug}`, request.url);
  const res = await fetch(apiUrl, {
    method: "GET",
    headers: { Accept: "text/html" },
  });
  const html = await res.text();
  const headers = new Headers(res.headers);
  headers.set("Content-Type", "text/html; charset=utf-8");
  headers.set("X-Vehicle-Preview", "1");
  headers.set("X-Vehicle-Slug", slug);
  return new Response(html, { status: res.status, headers });
}
