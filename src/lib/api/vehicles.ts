import type { Vehicle } from "@/types/vehicle";

// API base URL - uses environment variable if set, otherwise falls back to /api (for proxy)
const API_BASE_URL = import.meta.env.VITE_API_URL || "/api";

// Debug logging (only in development)
if (import.meta.env.DEV) {
  console.log("🔗 API Base URL:", API_BASE_URL);
}

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
  const url = `${API_BASE_URL}/vehicles`;
  
  try {
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
      },
    });
  
    if (!response.ok) {
      const errorText = await response.text().catch(() => response.statusText);
      console.error("❌ API Error:", response.status, errorText);
      throw new Error(`Failed to fetch vehicles: ${response.status} ${response.statusText}`);
    }
  
    const data: VehiclesResponse = await response.json();
  
    if (!data.success) {
      throw new Error("API returned unsuccessful response");
    }
  
    return data.data;
  } catch (error) {
    console.error("❌ Fetch Vehicles Error:", error);
    console.error("📍 Attempted URL:", url);
    throw error;
  }
}

/**
 * Fetches a single vehicle by ID
 */
export async function fetchVehicleById(id: string): Promise<Vehicle> {
  const url = `${API_BASE_URL}/vehicles/${id}`;
  
  try {
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
      },
    });
  
    if (!response.ok) {
      const errorText = await response.text().catch(() => response.statusText);
      console.error("❌ API Error:", response.status, errorText);
      throw new Error(`Failed to fetch vehicle: ${response.status} ${response.statusText}`);
    }
  
    const data: VehicleResponse = await response.json();
  
    if (!data.success) {
      throw new Error("API returned unsuccessful response");
    }
  
    return data.data;
  } catch (error) {
    console.error("❌ Fetch Vehicle Error:", error);
    console.error("📍 Attempted URL:", url);
    throw error;
  }
}
