import { Router } from "express";
import { getAllVehicles, getVehicleById } from "../db/database.js";
import {
  isCargateApiConfigured,
  getVehiclesFromCargateCached,
  getVehicleFromCarzillaApi,
  extractDescriptionFromRaw,
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
        }
      } catch {
        // GetVehicle fehlgeschlagen – Fahrzeug unverändert
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
