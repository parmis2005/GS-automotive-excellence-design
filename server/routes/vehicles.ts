import { Router } from "express";
import { Readable } from "node:stream";
import { getAllVehicles, getVehicleById } from "../db/database.js";
import {
  isCargateApiConfigured,
  getVehiclesFromCargateCached,
  getVehicleFromCarzillaApi,
  buildExposeUrlFromCarzillaVehicle,
  extractDescriptionFromRaw,
} from "../services/cargateApi.js";

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

  let exposeUrl = vehicle.exposeUrl?.trim();
  if ((!exposeUrl || (!exposeUrl.startsWith("http://") && !exposeUrl.startsWith("https://"))) && isCargateApiConfigured()) {
    const raw = await getVehicleFromCarzillaApi(id);
    if (raw) exposeUrl = buildExposeUrlFromCarzillaVehicle(raw, id) ?? undefined;
  }

  if (!exposeUrl || (!exposeUrl.startsWith("http://") && !exposeUrl.startsWith("https://"))) {
    return { exposeUrl: null, vehicleExists: true };
  }

  return { exposeUrl, vehicleExists: true };
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

    res.setHeader("Cache-Control", "public, max-age=60, s-maxage=60, stale-while-revalidate=300");
    res.json({
      success: true,
      count: vehicles.length,
      data: vehicles,
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

    // Freie Gestaltung (Custom Description) via GetVehicle – GetVehicleList enthält sie oft nicht
    if (isCargateApiConfigured()) {
      try {
        const raw = await getVehicleFromCarzillaApi(req.params.id);
        if (raw) {
          const description = extractDescriptionFromRaw(raw);
          if (description) {
            vehicle = { ...vehicle, description };
          } else if (process.env.CARGATE_DEBUG_DESCRIPTION === "1") {
            const keys = Object.keys(raw).filter((k) => /freie|gestaltung|description|beschreibung|text|comment|custom/i.test(k));
            console.warn(`[CarGate] Freie Gestaltung nicht gefunden für vid=${req.params.id}. Relevante Keys:`, keys.join(", ") || "(keine)");
          }
        }
      } catch {
        // GetVehicle fehlgeschlagen – Fahrzeug ohne Freie Gestaltung zurückgeben
      }
    }

    res.setHeader("Cache-Control", "public, max-age=60, s-maxage=60, stale-while-revalidate=300");
    res.json({
      success: true,
      data: vehicle,
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
