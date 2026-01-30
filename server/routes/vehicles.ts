import { Router } from "express";
import { getAllVehicles, getVehicleById } from "../db/database.js";
import { isCargateApiConfigured, getVehiclesFromCargateCached } from "../services/cargateApi.js";

export const vehiclesRouter = Router();

/**
 * GET /api/vehicles
 * Wenn CarGate API konfiguriert: zuerst CarGate (mit Cache); bei Fehler (z. B. 404) Fallback auf DB.
 * Sonst: aus Datenbank.
 */
vehiclesRouter.get("/", async (req, res) => {
  try {
    let vehicles;
    if (isCargateApiConfigured()) {
      try {
        vehicles = await getVehiclesFromCargateCached();
      } catch (apiError) {
        console.warn("⚠️ CarGate API Fehler, Fallback auf Datenbank:", apiError instanceof Error ? apiError.message : apiError);
        vehicles = await getAllVehicles();
      }
    } else {
      vehicles = await getAllVehicles();
    }

    res.json({
      success: true,
      count: vehicles.length,
      data: vehicles,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching vehicles:", error);
    res.json({
      success: true,
      count: 0,
      data: [],
      timestamp: new Date().toISOString(),
      warning: "Failed to fetch vehicles. Please try again later.",
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
