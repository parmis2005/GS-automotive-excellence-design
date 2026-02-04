/**
 * Utilities for building Exposé PDF URLs.
 * GS Auto format: https://fahrzeuge.gs-automobile-rheinland.de/Expose.pdf?oid={uuid}&ourl={encoded_detail_url}
 */

const EXPOSE_BASE_URL = "https://fahrzeuge.gs-automobile-rheinland.de";

function normalizeDealerUrl(url?: string | null): string | null {
  if (!url) return null;
  let normalized = url.trim();
  if (!normalized) return null;

  normalized = normalized
    .replace(/^httpss:\/\//i, "https://")
    .replace(/^http:\/\/https:\/\//i, "https://")
    .replace(/^https:\/\/https:\/\//i, "https://");

  if (normalized.startsWith("//")) {
    normalized = `https:${normalized}`;
  }

  if (normalized.startsWith("http://") || normalized.startsWith("https://")) {
    return normalized;
  }

  if (normalized.startsWith("/")) {
    return `${EXPOSE_BASE_URL}${normalized}`;
  }

  return `${EXPOSE_BASE_URL}/${normalized.replace(/^\/+/, "")}`;
}

function formatOidAsUuid(hex: string): string {
  const clean = (hex || "").replace(/-/g, "").trim();
  if (clean.length !== 32 || !/^[0-9a-fA-F]+$/.test(clean)) return hex;
  return `${clean.slice(0, 8)}-${clean.slice(8, 12)}-${clean.slice(12, 16)}-${clean.slice(16, 20)}-${clean.slice(20, 32)}`;
}

/**
 * Extrahiert Oid (UUID) aus OfferUrl-Pfad.
 * Format: …/91f374f1c4054bb49b58dace6dc0a446/1302
 */
function extractOidFromOfferUrl(offerUrl: string): string | null {
  if (!offerUrl || !offerUrl.includes("/")) return null;
  const withDashes = offerUrl.match(/\/([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})(?:\/|$)/);
  if (withDashes) return withDashes[1];
  const noDashes = offerUrl.match(/\/([0-9a-fA-F]{32})\/(?:\d+|$)/);
  if (noDashes) return formatOidAsUuid(noDashes[1]);
  return null;
}

/**
 * Baut die Exposé-URL für ein Fahrzeug.
 * @param exposeUrl - Bereits vorhandene Exposé-URL (wird bevorzugt)
 * @param offerUrl - Angebots-URL (für Fallback: oid extrahieren)
 * @param vehicleId - Fahrzeug-ID (letzter Fallback für vid-Parameter)
 */
export function getExposeUrl(
  exposeUrl?: string | null,
  offerUrl?: string | null,
  vehicleId?: string
): string | null {
  const validExpose = exposeUrl?.trim();
  if (validExpose && (validExpose.startsWith("http://") || validExpose.startsWith("https://"))) {
    return validExpose;
  }

  const normalizedOfferUrl = normalizeDealerUrl(offerUrl);
  const oid = normalizedOfferUrl ? extractOidFromOfferUrl(normalizedOfferUrl) : null;
  const detailUrl = normalizedOfferUrl
    || (vehicleId ? `${EXPOSE_BASE_URL}/Fahrzeugsuche/Details?vid=${vehicleId}` : null);

  if (!detailUrl) return null;

  const ourl = encodeURIComponent(detailUrl);
  if (oid) {
    return `${EXPOSE_BASE_URL}/Expose.pdf?oid=${encodeURIComponent(oid)}&ourl=${ourl}`;
  }
  if (vehicleId) {
    return `${EXPOSE_BASE_URL}/Expose.pdf?vid=${encodeURIComponent(vehicleId)}&ourl=${ourl}`;
  }
  return null;
}
