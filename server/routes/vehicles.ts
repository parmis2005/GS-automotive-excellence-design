import { Router } from "express";
import { Readable } from "node:stream";
import { getAllVehicles, getVehicleById, getExposeUrlsByVehicleIds } from "../db/database.js";
import {
  isCargateApiConfigured,
  getVehiclesFromCargateCached,
  getVehicleFromCarzillaApi,
  buildExposeUrlFromCarzillaVehicle,
  buildExposeReportingUrl,
  fetchReportIdFromDetailPage,
  extractDescriptionFromRaw,
} from "../services/cargateApi.js";

/** Prüft, ob die URL die gültige CarGate-Reporting-Exposé-URL ist (kein 404). */
function isCarGateReportingExposeUrl(url: string | undefined): boolean {
  return Boolean(url && url.includes("reporting.cargate360.de") && url.includes("DownloadReport"));
}

export const vehiclesRouter = Router();

async function resolveExposeUrlForVehicle(id: string): Promise<{ exposeUrl: string | null; vehicleExists: boolean }> {
  let vehicle;
  if (isCargateApiConfigured()) {
    try {
      const vehicles = await getVehiclesFromCargateCached();
      vehicle = vehicles.find((v) => v.id === id) ?? null;
    } catch {
      vehicle = await getVehicleById(id);
    }
  } else {
    vehicle = await getVehicleById(id);
  }

  if (!vehicle) {
    return { exposeUrl: null, vehicleExists: false };
  }

  // CarGate: Exposé-URL aus GetVehicle (Detail-API) oder von der Händler-Detailseite (reportId in URL/HTML)
  let exposeUrl: string | undefined;
  if (isCargateApiConfigured()) {
    const raw = await getVehicleFromCarzillaApi(id);
    if (raw) exposeUrl = buildExposeUrlFromCarzillaVehicle(raw, id) ?? undefined;
    if (!exposeUrl) {
      const reportId = await fetchReportIdFromDetailPage(id);
      if (reportId) exposeUrl = buildExposeReportingUrl(reportId);
    }
  }
  if (!exposeUrl && isCarGateReportingExposeUrl(vehicle.exposeUrl)) {
    exposeUrl = vehicle.exposeUrl?.trim();
  }
  if (!exposeUrl && process.env.DATABASE_URL) {
    const fromDb = await getExposeUrlsByVehicleIds([id]);
    if (fromDb[id]) exposeUrl = fromDb[id];
  }

  if (!exposeUrl || (!exposeUrl.startsWith("http://") && !exposeUrl.startsWith("https://"))) {
    return { exposeUrl: null, vehicleExists: true };
  }
  if (!isCarGateReportingExposeUrl(exposeUrl)) {
    return { exposeUrl: null, vehicleExists: true };
  }

  return { exposeUrl, vehicleExists: true };
}

/** Entfernt exposeUrl, wenn es keine CarGate-Reporting-URL ist (keine Händler-Expose.pdf-URL an Frontend/Cache). */
function sanitizeVehicleExposeUrl<T extends { exposeUrl?: string | null }>(v: T): T {
  if (v.exposeUrl != null && v.exposeUrl !== "" && !isCarGateReportingExposeUrl(v.exposeUrl)) {
    const { exposeUrl: _, ...rest } = v;
    return { ...rest, exposeUrl: undefined } as T;
  }
  return v;
}

/**
 * GET /api/vehicles
 * Wenn CarGate API konfiguriert: zuerst CarGate (mit Cache); bei Fehler (z. B. 404) Fallback auf DB.
 * Sonst: aus Datenbank.
 */
vehiclesRouter.get("/", async (req, res) => {
  try {
    let vehicles;
    let warning: string | undefined;

    if (isCargateApiConfigured()) {
      try {
        vehicles = await getVehiclesFromCargateCached();
      } catch (apiError) {
        const apiMsg = apiError instanceof Error ? apiError.message : String(apiError);
        console.warn("⚠️ CarGate API Fehler, Fallback auf Datenbank:", apiMsg);
        try {
          vehicles = await getAllVehicles();
          warning = "Fahrzeugdaten wurden aus der Datenbank geladen. Carzilla-API-Fehler: " + apiMsg;
        } catch (dbError) {
          const dbMsg = dbError instanceof Error ? dbError.message : String(dbError);
          console.error("❌ Datenbank-Fehler nach API-Fehler:", dbMsg);
          return res.status(500).json({
            success: false,
            count: 0,
            data: [],
            error: "Fahrzeuge konnten nicht geladen werden.",
            message: apiMsg + " Fallback Datenbank: " + dbMsg,
            timestamp: new Date().toISOString(),
          });
        }
      }
    } else {
      vehicles = await getAllVehicles();
    }

    if (vehicles.length > 0 && process.env.DATABASE_URL) {
      const exposeMap = await getExposeUrlsByVehicleIds(vehicles.map((v) => v.id));
      vehicles = vehicles.map((v) => ({
        ...v,
        exposeUrl: exposeMap[v.id] ?? v.exposeUrl,
      }));
    }
    res.setHeader("Cache-Control", "public, max-age=60, s-maxage=60, stale-while-revalidate=300");
    const sanitized = vehicles.map(sanitizeVehicleExposeUrl);
    res.json({
      success: true,
      count: sanitized.length,
      data: sanitized,
      ...(warning && { warning }),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("❌ Error fetching vehicles:", errorMessage);
    res.status(500).json({
      success: false,
      count: 0,
      data: [],
      error: "Fahrzeuge konnten nicht geladen werden.",
      message: errorMessage,
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * GET /api/vehicles/:id/expose
 * Redirect (302) zur Exposé-PDF-URL. Die Carzilla V6-Doku beschreibt keinen Exposé-PDF-Download
 * (nur Image-Service mit vid/bid und TemplateInfo.Links mit DetailsPage vid={Vehicle.VehicleId}).
 * Das Exposé wird vom Händlerserver bereitgestellt; wir bauen die URL mit vid=VehicleId oder oid=UUID.
 */
vehiclesRouter.get("/:id/expose", async (req, res) => {
  try {
    const id = req.params.id;
    const { exposeUrl, vehicleExists } = await resolveExposeUrlForVehicle(id);

    if (!vehicleExists) {
      return res.status(404).json({
        success: false,
        error: "Vehicle not found",
      });
    }

    if (!exposeUrl) {
      return res.status(404).json({
        success: false,
        error: "Exposé nicht verfügbar",
        message: "Für dieses Fahrzeug ist keine Exposé-URL hinterlegt.",
      });
    }

    return res.redirect(302, exposeUrl);
  } catch (error) {
    console.error("Error redirecting to expose:", error);
    res.status(500).json({
      success: false,
      error: "Failed to resolve expose URL",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

vehiclesRouter.get("/:id/expose/view", async (req, res) => {
  try {
    const id = req.params.id;
    const forceDownload = req.query.download === "1" || req.query.download === "true";
    const { exposeUrl, vehicleExists } = await resolveExposeUrlForVehicle(id);

    if (!vehicleExists) {
      return res.status(404).json({
        success: false,
        error: "Vehicle not found",
      });
    }

    if (!exposeUrl) {
      const accept = (req.headers.accept || "").toLowerCase();
      if (accept.includes("text/html")) {
        res.status(404).setHeader("Content-Type", "text/html; charset=utf-8").send(
          `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Exposé</title></head><body style="font-family:sans-serif;padding:2rem;text-align:center;"><p>Für dieses Fahrzeug ist aktuell kein Exposé verfügbar.</p></body></html>`
        );
        return;
      }
      return res.status(404).json({
        success: false,
        error: "Exposé nicht verfügbar",
        message: "Für dieses Fahrzeug ist keine Exposé-URL hinterlegt.",
      });
    }

    const response = await fetch(exposeUrl);
    if (!response.ok || !response.body) {
      return res.status(502).json({
        success: false,
        error: "Exposé nicht abrufbar",
        message: `Exposé konnte nicht geladen werden (Status ${response.status}).`,
      });
    }

    const contentType = response.headers.get("content-type") ?? "application/pdf";
    res.setHeader("Content-Type", contentType);

    const contentLength = response.headers.get("content-length");
    if (contentLength) {
      res.setHeader("Content-Length", contentLength);
    }

    const lastModified = response.headers.get("last-modified");
    if (lastModified) {
      res.setHeader("Last-Modified", lastModified);
    }

    const sourceDisposition = response.headers.get("content-disposition");
    if (forceDownload) {
      res.setHeader("Content-Disposition", "attachment; filename=\"Expose.pdf\"");
    } else if (sourceDisposition) {
      res.setHeader("Content-Disposition", sourceDisposition.includes("inline") ? sourceDisposition : sourceDisposition);
    } else {
      res.setHeader("Content-Disposition", "inline; filename=\"Expose.pdf\"");
    }

    res.setHeader("Cache-Control", "public, max-age=300, s-maxage=300");

    const body = response.body;
    const stream = Readable.fromWeb(body as unknown as ReadableStream);
    stream.on("error", (streamError) => {
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          error: "Fehler beim Streamen des Exposés",
          message: streamError instanceof Error ? streamError.message : "Unknown error",
        });
      } else {
        res.destroy(streamError as Error);
      }
    });
    stream.pipe(res);
  } catch (error) {
    console.error("Error streaming expose PDF:", error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        error: "Failed to stream expose PDF",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
});

/**
 * GET /api/vehicles/:id
 * Einzelnes Fahrzeug: bei CarGate aus Cache, plus Freie Gestaltung (Custom Description) per GetVehicle.
 * GetVehicleList liefert oft keine Freie Gestaltung – GetVehicle enthält die vollständige Beschreibung.
 */
vehiclesRouter.get("/:id", async (req, res) => {
  try {
    let vehicle;
    if (isCargateApiConfigured()) {
      try {
        const vehicles = await getVehiclesFromCargateCached();
        vehicle = vehicles.find((v) => v.id === req.params.id) ?? null;
      } catch {
        vehicle = await getVehicleById(req.params.id);
      }
    } else {
      vehicle = await getVehicleById(req.params.id);
    }

    if (!vehicle) {
      return res.status(404).json({
        success: false,
        error: "Vehicle not found",
      });
    }

    if (process.env.DATABASE_URL) {
      const exposeMap = await getExposeUrlsByVehicleIds([vehicle.id]);
      if (exposeMap[vehicle.id]) {
        vehicle = { ...vehicle, exposeUrl: exposeMap[vehicle.id] };
      }
    }

    // Freie Gestaltung (Custom Description) via GetVehicle – GetVehicleList enthält sie oft nicht
    if (isCargateApiConfigured()) {
      try {
        const raw = await getVehicleFromCarzillaApi(req.params.id);
        if (raw) {
          const description = extractDescriptionFromRaw(raw);
          if (description) {
            vehicle = { ...vehicle, description };
          } else {
            vehicle = { ...vehicle, description: undefined };
            if (process.env.CARGATE_DEBUG_DESCRIPTION === "1") {
              const keys = Object.keys(raw).filter((k) => /freie|gestaltung|description|beschreibung|text|comment|custom/i.test(k));
              console.warn(`[CarGate] Freie Gestaltung nicht gefunden für vid=${req.params.id}. Relevante Keys:`, keys.join(", ") || "(keine)");
              const sample = (label: string, value: unknown) => {
                if (typeof value !== "string") return `${label}: (leer)`;
                const trimmed = value.trim();
                if (!trimmed) return `${label}: (leer)`;
                return `${label}: len=${trimmed.length} preview=${trimmed.slice(0, 140).replace(/\s+/g, " ")}`;
              };
              console.warn(
                `[CarGate] Description-Samples vid=${req.params.id}:`,
                sample("Description", raw["Description"]),
                "|",
                sample("DescriptionAdditional", raw["DescriptionAdditional"]),
                "|",
                sample("DescriptionWithoutAdditional", raw["DescriptionWithoutAdditional"]),
                "|",
                sample("FormattedDescription", raw["FormattedDescription"])
              );
            }
          }
          const exposeUrlFromApi = buildExposeUrlFromCarzillaVehicle(raw, req.params.id);
          if (exposeUrlFromApi) {
            vehicle = { ...vehicle, exposeUrl: exposeUrlFromApi };
          }
          // Sonst bleibt exposeUrl aus DB (oben bereits gemerged)
        }
      } catch {
        // GetVehicle fehlgeschlagen – Fahrzeug unverändert
      }
    }

    res.setHeader("Cache-Control", "public, max-age=60, s-maxage=60, stale-while-revalidate=300");
    res.json({
      success: true,
      data: sanitizeVehicleExposeUrl(vehicle),
    });
  } catch (error) {
    console.error("Error fetching vehicle:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch vehicle",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});
