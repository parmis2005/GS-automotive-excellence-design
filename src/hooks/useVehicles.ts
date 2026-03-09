import { useQuery } from "@tanstack/react-query";
import { fetchVehicles, fetchVehicleById } from "@/lib/api/vehicles";
import type { Vehicle } from "@/types/vehicle";

/**
 * React Query hook to fetch all vehicles.
 *
 * Plain-English explanation:
 * - This function returns a React Query object that handles the request, caching, and errors.
 * - `queryKey: ["vehicles"]` is the cache key (same key = shared cache).
 * - `queryFn: fetchVehicles` is the function that actually calls the API.
 * - `staleTime` means how long the data is considered "fresh" (no refetch).
 * - `gcTime` controls how long unused data stays in cache.
 * - `retry` and `retryDelay` define automatic retries when the request fails.
 * - `throwOnError: false` means errors are returned in the hook result instead of thrown.
 */
export function useVehicles() {
  return useQuery<Vehicle[]>({
    queryKey: ["vehicles"],
    queryFn: fetchVehicles,
    staleTime: 2 * 60 * 1000, // 2 minutes – Sync läuft alle 5 Min, Nutzer sehen bald neue Daten
    gcTime: 60 * 60 * 1000, // 1 hour (formerly cacheTime)
    retry: 2, // Retry 2 times on failure
    retryDelay: 1000, // Wait 1 second between retries
    throwOnError: false, // Don't throw errors, return them instead
  });
}

/**
 * React Query hook to fetch a single vehicle by ID.
 *
 * Wenn die Fahrzeugdetailseite serverseitig vorgerendert wurde (vehicle-preview),
 * liegen die Daten in window.__PRELOADED_VEHICLE__. Dann wird KEIN Request an
 * /api/vehicles/:id ausgelöst – wichtig für SEO, da robots.txt /api/ blockiert.
 */
function getPreloadedVehicle(id: string): Vehicle | undefined {
  if (typeof window === "undefined" || !id) return undefined;
  const pre = window.__PRELOADED_VEHICLE__;
  if (!pre || pre.id !== id) return undefined;
  return pre;
}

export function useVehicle(id: string) {
  const preloaded = getPreloadedVehicle(id);
  return useQuery<Vehicle>({
    queryKey: ["vehicles", id],
    queryFn: () => fetchVehicleById(id),
    enabled: !!id,
    initialData: preloaded,
    // Bei Preload: kein Fetch (Googlebot darf /api/ nicht aufrufen)
    refetchOnMount: !preloaded,
    refetchOnWindowFocus: !preloaded,
    staleTime: preloaded ? 10 * 60 * 1000 : 2 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });
}
