import type { Vehicle } from "@/types/vehicle";

// API base URL - uses environment variable if set, otherwise falls back to /api (for proxy)
/**
 * Builds the base API URL for all vehicle requests.
 *
 * Explanation for non-TypeScript readers:
 * - We first check if an environment variable called `VITE_API_URL` exists.
 * - If it does NOT exist, we use `/api`, which is a local proxy path.
 * - If it exists, we clean it up (remove a trailing slash).
 * - If it does not end with `/api`, we append `/api` so every request hits the API.
 * - The returned string is later used like: `${API_BASE_URL}/vehicles`.
 */
const getApiBaseUrl = (): string => {
  const envUrl = import.meta.env.VITE_API_URL;
  
  // If no env variable, use /api (for local proxy)
  if (!envUrl) {
    return "/api";
  }
  
  // Remove trailing slash if present
  const baseUrl = envUrl.endsWith("/") ? envUrl.slice(0, -1) : envUrl;
  
  // If URL doesn't end with /api, add it
  if (!baseUrl.endsWith("/api")) {
    return `${baseUrl}/api`;
  }
  
  return baseUrl;
};

/**
 * Final API base URL used by all fetch calls in this file.
 * Example values:
 * - "/api"
 * - "https://example.com/api"
 */
const API_BASE_URL = getApiBaseUrl();

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
  count: number;
  data: Vehicle[];
  timestamp: string;
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
