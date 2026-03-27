/**
 * Basis-URL für Browser-`fetch` zum Node-Backend.
 *
 * - Lokal: `/api` (Vite-Proxy → localhost:3001).
 * - Produktion: `VITE_API_URL` setzen (HTTPS, z. B. https://api.gsauto.de), damit
 *   große Multipart-Uploads (Ankauf) **nicht** über Vercel laufen – dort greift ein
 *   kleines Request-Body-Limit (~4,5 MB), was sonst zu HTTP 413 führt.
 */
export function getApiBaseUrl(): string {
  const envUrl = import.meta.env.VITE_API_URL as string | undefined;
  if (!envUrl) {
    return "/api";
  }
  const baseUrl = envUrl.endsWith("/") ? envUrl.slice(0, -1) : envUrl;
  if (!baseUrl.endsWith("/api")) {
    return `${baseUrl}/api`;
  }
  return baseUrl;
}

export const API_BASE_URL = getApiBaseUrl();
