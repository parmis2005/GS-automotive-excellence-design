/**
 * Läuft nach dem Fahrzeug-Sync: Holt für jede VehicleId die Exposé-reportId
 * zuerst aus der GetVehicle-API, sonst per Headless-Browser von der Händler-Detailseite;
 * speichert die Reporting-URL in der DB.
 */

import { getReportIdFromApi, buildExposeReportingUrl } from "./cargateApi.js";
import { fetchReportIdWithBrowser } from "./exposeReportIdFetcher.js";
import { updateVehicleExposeUrl } from "../db/database.js";

const DELAY_MS = 2000;
const BATCH_SIZE = 1;

let isRunning = false;

export function isExposeSyncRunning(): boolean {
  return isRunning;
}

/**
 * Startet den Exposé-ReportId-Job im Hintergrund (nicht awaiten).
 * Pro Fahrzeug: Browser öffnen → Detailseite laden → reportId extrahieren → DB updaten.
 */
export function startExposeReportIdJob(vehicleIds: string[]): void {
  if (vehicleIds.length === 0) return;
  if (isRunning) {
    console.log("⏳ Exposé-Job läuft bereits, überspringe.");
    return;
  }

  isRunning = true;
  const ids = [...vehicleIds];
  console.log(`📄 Exposé-Job gestartet: ${ids.length} Fahrzeuge (im Hintergrund).`);

  (async () => {
    let done = 0;
    let found = 0;
    for (let i = 0; i < ids.length; i += BATCH_SIZE) {
      const batch = ids.slice(i, i + BATCH_SIZE);
      for (const id of batch) {
        try {
          let reportId = await getReportIdFromApi(id);
          if (!reportId) reportId = await fetchReportIdWithBrowser(id);
          if (reportId) {
            const url = buildExposeReportingUrl(reportId);
            await updateVehicleExposeUrl(id, url);
            found++;
            if (process.env.CARGATE_DEBUG_EXPOSE === "1") {
              console.warn(`[Exposé] vid=${id} reportId gefunden, DB aktualisiert.`);
            }
          }
        } catch (e) {
          if (process.env.CARGATE_DEBUG_EXPOSE === "1") {
            console.warn(`[Exposé] vid=${id} Fehler:`, e instanceof Error ? e.message : String(e));
          }
        }
        done++;
        if (done % 10 === 0) {
          console.log(`📄 Exposé-Job: ${done}/${ids.length} (${found} ReportIds gefunden).`);
        }
      }
      if (i + BATCH_SIZE < ids.length) {
        await new Promise((r) => setTimeout(r, DELAY_MS));
      }
    }

    console.log(`✅ Exposé-Job beendet: ${found}/${ids.length} ReportIds in DB gespeichert.`);
    isRunning = false;
  })().catch((err) => {
    console.error("❌ Exposé-Job Fehler:", err);
    isRunning = false;
  });
}
