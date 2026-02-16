/**
 * Exposé-PDF: Nur CarGate-Reporting-URL (reporting.cargate360.de) wird akzeptiert.
 * Kein Fallback mehr auf Händler-Expose.pdf (vid/oid).
 */

const REPORTING_EXPOSE_HOST = "reporting.cargate360.de";
const REPORTING_EXPOSE_PATH = "DownloadReport";

function isReportingExposeUrl(url: string | undefined | null): boolean {
  if (!url || typeof url !== "string") return false;
  const trimmed = url.trim();
  if (!trimmed.startsWith("http://") && !trimmed.startsWith("https://")) return false;
  try {
    const u = new URL(trimmed);
    return u.hostname === REPORTING_EXPOSE_HOST && u.pathname.includes(REPORTING_EXPOSE_PATH);
  } catch {
    return trimmed.includes(REPORTING_EXPOSE_HOST) && trimmed.includes(REPORTING_EXPOSE_PATH);
  }
}

/**
 * Gibt die Exposé-URL zurück, wenn es eine gültige CarGate-Reporting-URL ist.
 * Kein Fallback auf Händler-Expose.pdf – ohne Reporting-URL wird null zurückgegeben.
 */
export function getExposeUrl(
  exposeUrl?: string | null,
  _offerUrl?: string | null,
  _vehicleId?: string
): string | null {
  const valid = exposeUrl?.trim();
  if (valid && isReportingExposeUrl(valid)) {
    return valid;
  }
  return null;
}
