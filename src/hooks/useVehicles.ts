import { useQuery } from "@tanstack/react-query";
import { fetchVehicles, fetchVehicleById } from "@/lib/api/vehicles";
import type { Vehicle } from "@/types/vehicle";

/**
 * Liest serverseitig eingebettete Fahrzeugliste (page-html für /fahrzeuge).
 * Dann kein /api/vehicles-Request – wichtig für SEO, da robots.txt /api/ blockiert.
 */
function getPreloadedVehicles(): Vehicle[] | undefined {
  if (typeof window === "undefined") return undefined;
  const pre = window.__PRELOADED_VEHICLES__;
  if (!Array.isArray(pre) || pre.length === 0) return undefined;
  return pre;
}

/**
 * React Query hook to fetch all vehicles.
 * Nutzt window.__PRELOADED_VEHICLES__ als initialData, wenn auf /fahrzeuge serverseitig eingebettet.
 */
export function useVehicles() {
  const preloaded = getPreloadedVehicles();
  return useQuery<Vehicle[]>({
    queryKey: ["vehicles"],
    queryFn: fetchVehicles,
    initialData: preloaded,
    refetchOnMount: !preloaded,
    refetchOnWindowFocus: !preloaded,
    staleTime: preloaded ? 10 * 60 * 1000 : 2 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
    retry: 2,
    retryDelay: 1000,
    throwOnError: false,
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
