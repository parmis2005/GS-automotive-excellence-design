import type { Vehicle } from "@/types/vehicle";

export interface VehiclesResponse {
  success: boolean;
  count: number;
  data: Vehicle[];
  timestamp: string;
}

export interface VehicleResponse {
  success: boolean;
  data: Vehicle;
}

/**
 * Fetches all vehicles from the API
 */
export async function fetchVehicles(): Promise<Vehicle[]> {
  const response = await fetch("/api/vehicles");
  
  if (!response.ok) {
    throw new Error(`Failed to fetch vehicles: ${response.statusText}`);
  }
  
  const data: VehiclesResponse = await response.json();
  
  if (!data.success) {
    throw new Error("API returned unsuccessful response");
  }
  
  return data.data;
}

/**
 * Fetches a single vehicle by ID
 */
export async function fetchVehicleById(id: string): Promise<Vehicle> {
  const response = await fetch(`/api/vehicles/${id}`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch vehicle: ${response.statusText}`);
  }
  
  const data: VehicleResponse = await response.json();
  
  if (!data.success) {
    throw new Error("API returned unsuccessful response");
  }
  
  return data.data;
}
