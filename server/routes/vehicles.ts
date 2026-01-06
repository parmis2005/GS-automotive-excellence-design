import { Router } from "express";
import { fetchVehiclesFromWebsite } from "../services/vehicleScraper.js";

export const vehiclesRouter = Router();

/**
 * GET /api/vehicles
 * Fetches all vehicles from GS Automobile Rheinland website
 * Returns cached data if available (30-60 min cache)
 */
vehiclesRouter.get("/", async (req, res) => {
  try {
    const vehicles = await fetchVehiclesFromWebsite();
    
    res.json({
      success: true,
      count: vehicles.length,
      data: vehicles,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching vehicles:", error);
    
    // Return empty array instead of error to prevent frontend crashes
    // The frontend will handle empty state gracefully
    res.json({
      success: true,
      count: 0,
      data: [],
      timestamp: new Date().toISOString(),
      warning: "Failed to fetch vehicles from source. Please try again later.",
    });
  }
});

/**
 * GET /api/vehicles/:id
 * Fetches a single vehicle by ID
 */
vehiclesRouter.get("/:id", async (req, res) => {
  try {
    const vehicles = await fetchVehiclesFromWebsite();
    const vehicle = vehicles.find((v) => v.id === req.params.id);
    
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
