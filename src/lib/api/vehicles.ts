import type { Vehicle } from "@/types/vehicle";
import { API_BASE_URL } from "./baseUrl";

// Debug logging - always log in production for troubleshooting
console.log("🔗 API Base URL:", API_BASE_URL);
console.log("🔗 VITE_API_URL env:", import.meta.env.VITE_API_URL);

/**
 * Shape of the JSON returned by the server for the "all vehicles" endpoint.
 * - success: true/false indicates if the server handled the request correctly.
 * - count: how many vehicles are in the response.
 * - data: the array of vehicle objects.
 * - timestamp: server time when the response was created.
 */
export interface VehiclesResponse {
  success: boolean;
  count?: number;
  data?: Vehicle[];
  error?: string;
  message?: string;
  warning?: string;
  timestamp?: string;
}

/**
 * Shape of the JSON returned by the server for a single vehicle.
 */
export interface VehicleResponse {
  success: boolean;
  data: Vehicle;
}

/**
 * Fetches all vehicles from the API
 */
/**
 * Fetches all vehicles from the backend API.
 *
 * Step-by-step:
 * 1) Build the URL as `${API_BASE_URL}/vehicles`.
 * 2) Call `fetch()` to make a GET request.
 * 3) If the HTTP status is not OK, throw an error with details.
 * 4) Parse the JSON body into `VehiclesResponse`.
 * 5) If `success` is false, throw an error.
 * 6) Return `data` (the vehicles array).
 *
 * Returns:
 * - A Promise that resolves to an array of vehicles.
 */
export async function fetchVehicles(): Promise<Vehicle[]> {
  const url = `${API_BASE_URL}/vehicles`;

  try {
    const response = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data: VehiclesResponse = await response.json().catch(() => ({
      success: false,
      error: "Ungültige Server-Antwort",
      message: response.statusText || `HTTP ${response.status}`,
    }));

    if (!response.ok) {
      const msg = data?.error || data?.message || `${response.status} ${response.statusText}`;
      console.error("❌ API Error:", response.status, msg);
      throw new Error(msg);
    }

    if (!data.success) {
      const msg = data?.error || data?.message || "Die Fahrzeuge konnten nicht geladen werden.";
      throw new Error(msg);
    }

    return data.data ?? [];
  } catch (error) {
    console.error("❌ Fetch Vehicles Error:", error);
    console.error("📍 Attempted URL:", url);
    throw error;
  }
}

/**
 * Fetches a single vehicle by its ID.
 *
 * Step-by-step:
 * 1) Build the URL as `${API_BASE_URL}/vehicles/${id}`.
 * 2) Call `fetch()` to make a GET request.
 * 3) If the HTTP status is not OK, throw an error with details.
 * 4) Parse the JSON body into `VehicleResponse`.
 * 5) If `success` is false, throw an error.
 * 6) Return `data` (the vehicle object).
 *
 * Returns:
 * - A Promise that resolves to one vehicle.
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
