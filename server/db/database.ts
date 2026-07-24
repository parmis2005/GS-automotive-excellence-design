import { Pool, PoolClient } from "pg";
import type { Vehicle } from "../types/vehicle.js";

// Create connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes("neon") ? { rejectUnauthorized: false } : false,
  // Connection pool settings
  max: 10, // Maximum number of clients in the pool
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 5000, // Return an error after 5 seconds if connection could not be established
});

// Test connection
pool.on("connect", () => {
  console.log("✅ Database connected");
});

pool.on("error", (err) => {
  console.error("❌ Database pool error:", err.message);
});

/** Holt einen Client aus dem Pool und fängt Fehler ab, damit Verbindungsabbrüche den Prozess nicht beenden. */
async function getClient(): Promise<PoolClient> {
  const client = await pool.connect();
  client.on("error", (err: Error) => {
    console.error("❌ Database client error (connection lost):", err.message);
  });
  return client;
}

// Database schema SQL
const SCHEMA_SQL = `
-- Vehicles table
CREATE TABLE IF NOT EXISTS vehicles (
  id VARCHAR(255) PRIMARY KEY,
  image TEXT,
  brand VARCHAR(255) NOT NULL,
  model VARCHAR(255) NOT NULL,
  price DECIMAL(12, 2) NOT NULL,
  year INTEGER NOT NULL,
  mileage INTEGER DEFAULT 0,
  fuel VARCHAR(100),
  transmission VARCHAR(100),
  is_new BOOLEAN DEFAULT false,
  description TEXT,
  power INTEGER,
  power_kw INTEGER,
  exterior_color VARCHAR(100),
  interior_color VARCHAR(100),
  equipment TEXT[],
  expose_url TEXT,
  offer_url TEXT,
  internal_number VARCHAR(50),
  arrival_date DATE,
  category VARCHAR(100),
  vat_displayable BOOLEAN,
  vehicle_type VARCHAR(100),
  previous_owners INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Baureihe (z. B. G21) – optional, für Anzeige in Klammern
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS production_series VARCHAR(20);

-- Modellzusatz (z. B. eDrive40 GC M-SPORT-PRO) – unter Titel anzeigen
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS model_variant VARCHAR(255);

-- Vollständige Herstellerfarbe (z. B. CAPE YORK GRUEN METALLIC) – für Detailansicht
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS exterior_color_full VARCHAR(150);

-- Hubraum (ccm) und Zylinderanzahl
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS cubic_capacity INTEGER;
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS cylinders INTEGER;

-- Bildanzahl (> 4 = echte Fotos, 4 = Platzhalter wenn keine Fotos)
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS image_count INTEGER;

-- Erstzulassungsmonat (1-12), von CarGate InitialRegistration
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS first_registration_month INTEGER;

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_vehicles_brand ON vehicles(brand);
CREATE INDEX IF NOT EXISTS idx_vehicles_category ON vehicles(category);
CREATE INDEX IF NOT EXISTS idx_vehicles_fuel ON vehicles(fuel);
CREATE INDEX IF NOT EXISTS idx_vehicles_price ON vehicles(price);
CREATE INDEX IF NOT EXISTS idx_vehicles_year ON vehicles(year);
CREATE INDEX IF NOT EXISTS idx_vehicles_last_synced ON vehicles(last_synced_at);

-- Update timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Update timestamp trigger
DROP TRIGGER IF EXISTS update_vehicles_updated_at ON vehicles;
CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON vehicles
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Purchase inquiries (Ankauf-Anfragen)
CREATE TABLE IF NOT EXISTS purchase_inquiries (
  id SERIAL PRIMARY KEY,
  payload JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_purchase_inquiries_created_at ON purchase_inquiries(created_at DESC);

-- Active visitors (anonym, nur session_id + last_seen für "X Besucher gerade online")
CREATE TABLE IF NOT EXISTS active_visitors (
  session_id VARCHAR(64) PRIMARY KEY,
  last_seen TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_active_visitors_last_seen ON active_visitors(last_seen);
`;

/**
 * Initialize database - create tables if they don't exist
 */
export async function initializeDatabase(): Promise<void> {
  const client = await getClient();
  try {
    // Execute schema
    await client.query(SCHEMA_SQL);
    
    console.log("✅ Database schema initialized");
  } catch (error) {
    console.error("❌ Error initializing database:", error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Get all vehicles from database
 */
export async function getAllVehicles(): Promise<Vehicle[]> {
  const client = await getClient();
  try {
    const result = await client.query(`
      SELECT 
        id,
        image,
        brand,
        model,
        price::numeric::float8 as price,
        year,
        first_registration_month as "firstRegistrationMonth",
        mileage,
        fuel,
        transmission,
        is_new as "isNew",
        description,
        power,
        power_kw as "powerKw",
        exterior_color as "exteriorColor",
        interior_color as "interiorColor",
        equipment,
        expose_url as "exposeUrl",
        offer_url as "offerUrl",
        internal_number as "internalNumber",
        arrival_date as "arrivalDate",
        category,
        vat_displayable as "vatDisplayable",
        vehicle_type as "vehicleType",
        previous_owners as "previousOwners",
        production_series as "productionSeries",
        model_variant as "modelVariant",
        exterior_color_full as "exteriorColorFull",
        cubic_capacity as "cubicCapacity",
        cylinders,
        image_count as "imageCount"
      FROM vehicles
      ORDER BY updated_at DESC
    `);
    
    return result.rows.map(row => {
      const arrivalDate = row.arrivalDate as string | null;
      const standtage = arrivalDate
        ? Math.max(0, Math.floor((Date.now() - new Date(arrivalDate).getTime()) / 86400000))
        : undefined;
      return {
        ...row,
        price: parseFloat(row.price),
        standtage,
      };
    }) as Vehicle[];
  } catch (error) {
    console.error("❌ Error fetching vehicles from database:", error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Get a single vehicle by ID
 */
export async function getVehicleById(id: string): Promise<Vehicle | null> {
  const client = await getClient();
  try {
    const result = await client.query(
      `
      SELECT 
        id,
        image,
        brand,
        model,
        price::numeric::float8 as price,
        year,
        first_registration_month as "firstRegistrationMonth",
        mileage,
        fuel,
        transmission,
        is_new as "isNew",
        description,
        power,
        power_kw as "powerKw",
        exterior_color as "exteriorColor",
        interior_color as "interiorColor",
        equipment,
        expose_url as "exposeUrl",
        offer_url as "offerUrl",
        internal_number as "internalNumber",
        arrival_date as "arrivalDate",
        category,
        vat_displayable as "vatDisplayable",
        vehicle_type as "vehicleType",
        previous_owners as "previousOwners",
        production_series as "productionSeries",
        model_variant as "modelVariant",
        exterior_color_full as "exteriorColorFull",
        cubic_capacity as "cubicCapacity",
        cylinders,
        image_count as "imageCount"
      FROM vehicles
      WHERE id = $1
    `,
      [id]
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const row = result.rows[0];
    const arrivalDate = row.arrivalDate as string | null;
    const standtage = arrivalDate
      ? Math.max(0, Math.floor((Date.now() - new Date(arrivalDate).getTime()) / 86400000))
      : undefined;
    return {
      ...row,
      price: parseFloat(row.price),
      standtage,
    } as Vehicle;
  } catch (error) {
    console.error(`❌ Error fetching vehicle ${id} from database:`, error);
    throw error;
  } finally {
    client.release();
  }
}

/** Max lengths from schema (VARCHAR) – truncate to avoid "value too long" errors. */
const MAX_LEN = {
  id: 255,
  brand: 255,
  model: 255,
  fuel: 100,
  transmission: 100,
  exterior_color: 100,
  interior_color: 100,
  internal_number: 50,
  category: 100,
  vehicle_type: 100,
  production_series: 20,
  model_variant: 255,
  exterior_color_full: 150,
} as const;

function truncate(str: string | null | undefined, max: number): string | null {
  if (str == null) return null;
  const s = String(str).trim();
  return s.length <= max ? s : s.slice(0, max);
}

/**
 * Upsert vehicles (insert or update)
 * Uses a transaction to ensure all-or-nothing
 */
export async function upsertVehicles(vehicles: Vehicle[]): Promise<void> {
  const client = await getClient();
  try {
    await client.query("BEGIN");
    
    const now = new Date();
    
    for (const vehicle of vehicles) {
      const id = truncate(vehicle.id, MAX_LEN.id);
      const brand = truncate(vehicle.brand, MAX_LEN.brand);
      const model = truncate(vehicle.model, MAX_LEN.model);
      if (!id || !brand || !model) continue;
      await client.query(
        `
        INSERT INTO vehicles (
          id, image, brand, model, price, year, first_registration_month, mileage, fuel, transmission,
          is_new, description, power, power_kw, exterior_color, exterior_color_full, interior_color,
          equipment, expose_url, offer_url, internal_number, arrival_date,
          category, vat_displayable, vehicle_type, previous_owners, production_series, model_variant,
          cubic_capacity, cylinders, image_count, last_synced_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32)
        ON CONFLICT (id) DO UPDATE SET
          image = EXCLUDED.image,
          brand = EXCLUDED.brand,
          model = EXCLUDED.model,
          price = EXCLUDED.price,
          year = EXCLUDED.year,
          first_registration_month = EXCLUDED.first_registration_month,
          mileage = EXCLUDED.mileage,
          fuel = EXCLUDED.fuel,
          transmission = EXCLUDED.transmission,
          is_new = EXCLUDED.is_new,
          description = EXCLUDED.description,
          power = EXCLUDED.power,
          power_kw = EXCLUDED.power_kw,
          exterior_color = EXCLUDED.exterior_color,
          interior_color = EXCLUDED.interior_color,
          equipment = EXCLUDED.equipment,
          expose_url = EXCLUDED.expose_url,
          offer_url = EXCLUDED.offer_url,
          internal_number = EXCLUDED.internal_number,
          arrival_date = EXCLUDED.arrival_date,
          category = EXCLUDED.category,
          vat_displayable = EXCLUDED.vat_displayable,
          vehicle_type = EXCLUDED.vehicle_type,
          previous_owners = EXCLUDED.previous_owners,
          production_series = EXCLUDED.production_series,
          model_variant = EXCLUDED.model_variant,
          exterior_color_full = EXCLUDED.exterior_color_full,
          cubic_capacity = EXCLUDED.cubic_capacity,
          cylinders = EXCLUDED.cylinders,
          image_count = EXCLUDED.image_count,
          last_synced_at = $32
        `,
        [
          id,
          vehicle.image || null,
          brand,
          model,
          vehicle.price,
          vehicle.year,
          vehicle.firstRegistrationMonth ?? null,
          vehicle.mileage || 0,
          truncate(vehicle.fuel, MAX_LEN.fuel),
          truncate(vehicle.transmission, MAX_LEN.transmission),
          vehicle.isNew || false,
          vehicle.description || null,
          vehicle.power || null,
          vehicle.powerKw || null,
          truncate(vehicle.exteriorColor, MAX_LEN.exterior_color),
          truncate(vehicle.exteriorColorFull, MAX_LEN.exterior_color_full),
          truncate(vehicle.interiorColor, MAX_LEN.interior_color),
          vehicle.equipment || null,
          vehicle.exposeUrl || null,
          vehicle.offerUrl || null,
          truncate(vehicle.internalNumber, MAX_LEN.internal_number),
          vehicle.arrivalDate || null,
          truncate(vehicle.category, MAX_LEN.category),
          vehicle.vatDisplayable ?? null,
          truncate(vehicle.vehicleType, MAX_LEN.vehicle_type),
          vehicle.previousOwners || null,
          truncate(vehicle.productionSeries, MAX_LEN.production_series),
          truncate(vehicle.modelVariant, MAX_LEN.model_variant),
          vehicle.cubicCapacity || null,
          vehicle.cylinders || null,
          vehicle.imageCount ?? null,
          now,
        ]
      );
    }
    
    await client.query("COMMIT");
    console.log(`✅ Successfully upserted ${vehicles.length} vehicles into database`);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Error upserting vehicles:", error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Delete vehicles that are no longer in the source
 * This is called after a successful sync to remove old vehicles
 * Only deletes vehicles that are not in the current vehicle list
 */
export async function deleteOldVehicles(currentVehicleIds: string[]): Promise<number> {
  const client = await getClient();
  try {
    if (currentVehicleIds.length === 0) {
      // Don't delete anything if no vehicles were fetched
      return 0;
    }

    // Delete vehicles that are not in the current vehicle list
    const result = await client.query(
      `
      DELETE FROM vehicles
      WHERE id NOT IN (SELECT unnest($1::text[]))
      RETURNING id
    `,
      [currentVehicleIds]
    );
    
    const deletedCount = result.rowCount || 0;
    if (deletedCount > 0) {
      console.log(`🗑️  Deleted ${deletedCount} old vehicles from database`);
    }
    
    return deletedCount;
  } catch (error) {
    console.error("❌ Error deleting old vehicles:", error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Get the timestamp of the last successful sync
 */
export async function getLastSyncTimestamp(): Promise<Date | null> {
  const client = await getClient();
  try {
    const result = await client.query(
      `SELECT MAX(last_synced_at) as last_sync FROM vehicles`
    );
    
    if (result.rows.length === 0 || !result.rows[0].last_sync) {
      return null;
    }
    
    return new Date(result.rows[0].last_sync);
  } catch (error) {
    console.error("❌ Error getting last sync timestamp:", error);
    return null;
  } finally {
    client.release();
  }
}

/**
 * Holt alle Ankauf-Anfragen aus der Datenbank (neueste zuerst)
 */
export async function getPurchaseInquiries(limit = 100): Promise<Array<{ id: number; payload: Record<string, unknown>; createdAt: string }>> {
  const client = await getClient();
  try {
    const result = await client.query(
      `SELECT id, payload, created_at FROM purchase_inquiries ORDER BY created_at DESC LIMIT $1`,
      [limit]
    );
    return result.rows.map((row) => ({
      id: row.id,
      payload: row.payload as Record<string, unknown>,
      createdAt: row.created_at as string,
    }));
  } catch (error) {
    console.error("❌ Error fetching purchase inquiries:", error);
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Speichert eine Ankauf-Anfrage in der Datenbank
 */
export async function insertPurchaseInquiry(payload: Record<string, unknown>): Promise<number> {
  const client = await getClient();
  try {
    const result = await client.query(
      `INSERT INTO purchase_inquiries (payload) VALUES ($1) RETURNING id`,
      [JSON.stringify(payload)]
    );
    return result.rows[0].id;
  } catch (error) {
    console.error("❌ Error inserting purchase inquiry:", error);
    throw error;
  } finally {
    client.release();
  }
}

/** Aktivität eines Besuchers erfassen (anonym, nur Session-ID). Für "X Besucher gerade online". */
export async function recordActiveVisit(sessionId: string): Promise<void> {
  if (!sessionId || sessionId.length > 64) return;
  const client = await getClient();
  try {
    await client.query(
      `INSERT INTO active_visitors (session_id, last_seen) VALUES ($1, CURRENT_TIMESTAMP)
       ON CONFLICT (session_id) DO UPDATE SET last_seen = CURRENT_TIMESTAMP`,
      [sessionId]
    );
  } finally {
    client.release();
  }
}

/** Anzahl Besucher, die in den letzten 5 Minuten aktiv waren. Entfernt veraltete Einträge. */
export async function getActiveVisitorCount(): Promise<number> {
  const client = await getClient();
  try {
    await client.query(
      `DELETE FROM active_visitors WHERE last_seen < NOW() - INTERVAL '5 minutes'`
    );
    const result = await client.query(
      `SELECT COUNT(*)::int AS count FROM active_visitors`
    );
    return result.rows[0]?.count ?? 0;
  } finally {
    client.release();
  }
}

/**
 * Close the database pool (for graceful shutdown)
 */
export async function closeDatabase(): Promise<void> {
  await pool.end();
  console.log("✅ Database connection pool closed");
}
