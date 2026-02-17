import { fetchVehiclesFromWebsite } from "./vehicleScraper.js";
import {
  isCargateApiConfigured,
  fetchVehiclesFromCargateApi,
  clearVehiclesCache,
} from "./cargateApi.js";
import { upsertVehicles, deleteOldVehicles } from "../db/database.js";
import { getVehicleImageCount } from "../lib/imageCount.js";
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
      clearVehiclesCache(); // Frisch von CarGate holen, nicht aus 24h-Cache
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

    // Bildanzahl ermitteln (für "Sofort verfügbar" – nur Autos mit > 4 Fotos)
    const BATCH_SIZE = 8;
    const hasValidImage = (v: Vehicle) =>
      v.image && v.image.trim() !== "" && !v.image.includes("placeholder") &&
      (v.image.startsWith("http://") || v.image.startsWith("https://"));
    for (let i = 0; i < vehicles.length; i += BATCH_SIZE) {
      const batch = vehicles.slice(i, i + BATCH_SIZE);
      await Promise.all(
        batch.map(async (v) => {
          if (!hasValidImage(v)) {
            v.imageCount = 0;
            return;
          }
          try {
            v.imageCount = await getVehicleImageCount(v.id, v.image, 8);
          } catch {
            v.imageCount = 0;
          }
        })
      );
      if (i + BATCH_SIZE < vehicles.length) {
        await new Promise((r) => setTimeout(r, 50));
      }
    }

    // Update database with new vehicles
    await upsertVehicles(vehicles);

    // Delete vehicles that are no longer in the source
    await deleteOldVehicles(vehicles.map((v) => v.id));

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
