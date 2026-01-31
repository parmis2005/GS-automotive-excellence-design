import { Router } from "express";
import { getAllVehicles, getVehicleById } from "../db/database.js";
import {
  isCargateApiConfigured,
  getVehiclesFromCargateCached,
  getVehicleFromCarzillaApi,
  buildExposeUrlFromCarzillaVehicle,
} from "../services/cargateApi.js";

export const vehiclesRouter = Router();

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
 * Redirect (302) zur Exposé-PDF-URL. Laut Carzilla V6-Doku gibt es keine „GetExposé PDF“-Methode;
 * wir nutzen GetVehicle(vehicleId) für Oid und bauen die Händler-URL (Expose.pdf?oid=…&ourl=…).
 */
vehiclesRouter.get("/:id/expose", async (req, res) => {
  try {
    const id = req.params.id;
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
      return res.status(404).json({
        success: false,
        error: "Vehicle not found",
      });
    }

    let exposeUrl = vehicle.exposeUrl?.trim();
    if ((!exposeUrl || (!exposeUrl.startsWith("http://") && !exposeUrl.startsWith("https://"))) && isCargateApiConfigured()) {
      const raw = await getVehicleFromCarzillaApi(id);
      if (raw) exposeUrl = buildExposeUrlFromCarzillaVehicle(raw, id) ?? undefined;
    }

    if (!exposeUrl || (!exposeUrl.startsWith("http://") && !exposeUrl.startsWith("https://"))) {
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

/**
 * GET /api/vehicles/:id
 * Einzelnes Fahrzeug: bei CarGate direkt aus Cache, sonst aus DB.
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
