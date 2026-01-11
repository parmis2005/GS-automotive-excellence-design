-- PostgreSQL Schema for Vehicles
-- This schema stores all vehicle data scraped from GS Automobile

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
  power INTEGER, -- PS
  power_kw INTEGER, -- kW
  exterior_color VARCHAR(100),
  interior_color VARCHAR(100),
  equipment TEXT[], -- Array of strings
  expose_url TEXT,
  offer_url TEXT,
  internal_number VARCHAR(50),
  arrival_date DATE,
  category VARCHAR(100),
  vat_displayable BOOLEAN,
  vehicle_type VARCHAR(100),
  previous_owners INTEGER,
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_vehicles_brand ON vehicles(brand);
CREATE INDEX IF NOT EXISTS idx_vehicles_category ON vehicles(category);
CREATE INDEX IF NOT EXISTS idx_vehicles_fuel ON vehicles(fuel);
CREATE INDEX IF NOT EXISTS idx_vehicles_price ON vehicles(price);
CREATE INDEX IF NOT EXISTS idx_vehicles_year ON vehicles(year);
CREATE INDEX IF NOT EXISTS idx_vehicles_last_synced ON vehicles(last_synced_at);

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON vehicles
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
