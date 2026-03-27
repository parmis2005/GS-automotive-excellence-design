/**
 * Basis-URL für Browser-`fetch` zum Node-Backend.
 *
 * - Lokal: `/api` (Vite-Proxy → localhost:3001).
 * - Produktion: `VITE_API_URL` setzen (HTTPS, z. B. https://api.gsauto.de), damit
 *   große Multipart-Uploads (Ankauf) **nicht** über Vercel laufen – dort greift ein
 *   kleines Request-Body-Limit (~4,5 MB), was sonst zu HTTP 413 führt.
 */
function normalizeApiBase(envUrl: string): string {
  const baseUrl = envUrl.endsWith("/") ? envUrl.slice(0, -1) : envUrl;
  if (!baseUrl.endsWith("/api")) {
    return `${baseUrl}/api`;
  }
  return baseUrl;
}

export function getApiBaseUrl(): string {
  const envUrl = (import.meta.env.VITE_API_URL as string | undefined)?.trim();
  if (!envUrl) {
    return "/api";
  }
  return normalizeApiBase(envUrl);
}

/**
 * Nur Ankauf-Formular (große Multipart-POSTs). Optional eigene Basis, damit Fahrzeuglisten
 * weiter über Vercel `/api` laufen können, der Ankauf aber direkt zum Droplet geht (Vercel ~4,5 MB).
 */
export function getPurchaseInquiryUrl(): string {
  const direct = (import.meta.env.VITE_PURCHASE_API_BASE as string | undefined)?.trim();
  if (direct) {
    return `${normalizeApiBase(direct)}/purchase-inquiry`;
  }
  return `${getApiBaseUrl()}/purchase-inquiry`;
}

export const API_BASE_URL = getApiBaseUrl();
