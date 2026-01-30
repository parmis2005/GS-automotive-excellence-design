import { fetchVehiclesFromWebsite } from "./vehicleScraper.js";
import {
  isCargateApiConfigured,
  fetchVehiclesFromCargateApi,
} from "./cargateApi.js";
import { upsertVehicles, getLastSyncTimestamp, deleteOldVehicles } from "../db/database.js";
import type { Vehicle } from "../types/vehicle.js";

let syncInterval: NodeJS.Timeout | null = null;
let isSyncing = false;

/**
 * Sync vehicles into the database.
 * Uses CarGate Carzilla V6 API if CARGATE_API_KEY and CARGATE_API_BASE_URL are set,
 * otherwise falls back to scraping the GS Auto website.
 * If the sync fails, the old data remains in the database (graceful degradation).
 */
export async function syncVehicles(): Promise<{ success: boolean; count: number; error?: string }> {
  // Prevent concurrent syncs
  if (isSyncing) {
    console.log("⏳ Sync already in progress, skipping...");
    return { success: false, count: 0, error: "Sync already in progress" };
  }

  isSyncing = true;
  const startTime = Date.now();

  try {
    console.log("🔄 Starting vehicle sync...");

    let vehicles: Vehicle[];

    if (isCargateApiConfigured()) {
      console.log("📡 Using CarGate Carzilla V6 API as data source");
      try {
        vehicles = await fetchVehiclesFromCargateApi();
      } catch (apiError) {
        console.warn("⚠️ CarGate API failed, falling back to website scraper:", apiError);
        vehicles = await fetchVehiclesFromWebsite();
      }
    } else {
      console.log("📄 Using GS Auto website scraper (CarGate API not configured)");
      vehicles = await fetchVehiclesFromWebsite();
    }
    
    if (vehicles.length === 0) {
      console.warn("⚠️  No vehicles fetched, keeping existing data");
      return { success: false, count: 0, error: "No vehicles fetched" };
    }

    console.log(`✅ Fetched ${vehicles.length} vehicles`);

    // Update database with new vehicles
    await upsertVehicles(vehicles);

    // Delete vehicles that are no longer in the source
    const currentVehicleIds = vehicles.map(v => v.id);
    await deleteOldVehicles(currentVehicleIds);

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`✅ Sync completed successfully in ${duration}s (${vehicles.length} vehicles)`);

    return { success: true, count: vehicles.length };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("❌ Error during sync:", errorMessage);
    console.log("💡 Keeping existing data in database - website continues to work with last known data");
    
    // Don't throw - let the old data remain in the database
    return { success: false, count: 0, error: errorMessage };
  } finally {
    isSyncing = false;
  }
}

/**
 * Start the background sync job
 * Syncs every 30 minutes (1800000 ms)
 */
export function startSyncJob(intervalMinutes: number = 30): void {
  if (syncInterval) {
    console.log("⚠️  Sync job already running");
    return;
  }

  const intervalMs = intervalMinutes * 60 * 1000;
  
  console.log(`🔄 Starting background sync job (every ${intervalMinutes} minutes)`);
  
  // Run initial sync immediately
  syncVehicles().catch((error) => {
    console.error("❌ Error in initial sync:", error);
    console.log("💡 Website will use existing data from database");
  });

  // Then run sync at interval
  syncInterval = setInterval(() => {
    syncVehicles().catch((error) => {
      console.error("❌ Error in scheduled sync:", error);
      console.log("💡 Website continues to use existing data from database");
    });
  }, intervalMs);

  console.log(`✅ Background sync job started (interval: ${intervalMinutes} minutes)`);
}

/**
 * Stop the background sync job
 */
export function stopSyncJob(): void {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
    console.log("✅ Background sync job stopped");
  }
}

/**
 * Get sync status
 */
export function getSyncStatus(): { isRunning: boolean; isSyncing: boolean } {
  return {
    isRunning: syncInterval !== null,
    isSyncing,
  };
}
