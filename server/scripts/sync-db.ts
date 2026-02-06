/**
 * Einmaliger DB-Sync (Fahrzeuge + Bildanzahl).
 * Usage: npx tsx server/scripts/sync-db.ts
 */
import "dotenv/config";
import { initializeDatabase, closeDatabase } from "../db/database.js";
import { syncVehicles } from "../services/syncService.js";

async function main() {
  console.log("🔄 Starting manual DB sync...\n");
  try {
    if (!process.env.DATABASE_URL) {
      console.error("❌ DATABASE_URL ist nicht gesetzt (.env)");
      process.exit(1);
    }
    await initializeDatabase();
    const result = await syncVehicles();
    if (result.success) {
      console.log(`\n✅ Sync erfolgreich: ${result.count} Fahrzeuge`);
    } else {
      console.error(`\n❌ Sync fehlgeschlagen: ${result.error ?? "Unbekannter Fehler"}`);
      process.exit(1);
    }
  } finally {
    await closeDatabase();
  }
}

main();
