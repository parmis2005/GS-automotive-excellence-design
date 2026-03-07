/**
 * Vercel Edge Middleware: Leitet Anfragen an /fahrzeuge/:slug an die
 * vehicle-preview API weiter, damit Crawler (WhatsApp, Facebook) die
 * fahrzeugspezifische Link-Vorschau bekommen.
 * Läuft vor den vercel.json-Rewrites.
 */
import { rewrite, next } from "@vercel/functions";

export const config = {
  matcher: ["/fahrzeuge/:slug", "/fahrzeuge/:slug/"],
};

export default function middleware(request) {
  const url = new URL(request.url);
  const pathname = url.pathname;
  // /fahrzeuge/8768391-mini-cooper -> slug = 8768391-mini-cooper
  const prefix = "/fahrzeuge/";
  if (!pathname.startsWith(prefix) || pathname === "/fahrzeuge") {
    return next();
  }
  const slug = pathname.slice(prefix.length).split("/")[0];
  if (!slug) return next();
  return rewrite(new URL(`/api/vehicle-preview/${slug}`, request.url));
}
