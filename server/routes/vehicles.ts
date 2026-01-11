import { Router } from "express";
import { getAllVehicles, getVehicleById } from "../db/database.js";

export const vehiclesRouter = Router();

/**
 * GET /api/vehicles
 * Fetches all vehicles from database
 * Data is updated by background job every 30 minutes
 */
vehiclesRouter.get("/", async (req, res) => {
  try {
    const vehicles = await getAllVehicles();
    
    res.json({
      success: true,
      count: vehicles.length,
      data: vehicles,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching vehicles from database:", error);
    
    // Return empty array instead of error to prevent frontend crashes
    // The frontend will handle empty state gracefully
    res.json({
      success: true,
      count: 0,
      data: [],
      timestamp: new Date().toISOString(),
      warning: "Failed to fetch vehicles from database. Please try again later.",
    });
  }
});

/**
 * GET /api/vehicles/:id
 * Fetches a single vehicle by ID from database
 */
vehiclesRouter.get("/:id", async (req, res) => {
  try {
    const vehicle = await getVehicleById(req.params.id);
    
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
    console.error("Error fetching vehicle from database:", error);
    
    res.status(500).json({
      success: false,
      error: "Failed to fetch vehicle",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
});
