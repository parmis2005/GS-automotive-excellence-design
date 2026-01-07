import { useQuery } from "@tanstack/react-query";
import { fetchVehicles, fetchVehicleById } from "@/lib/api/vehicles";
import type { Vehicle } from "@/types/vehicle";

/**
 * React Query hook to fetch all vehicles
 */
export function useVehicles() {
  return useQuery<Vehicle[]>({
    queryKey: ["vehicles"],
    queryFn: fetchVehicles,
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000, // 1 hour (formerly cacheTime)
    retry: 2, // Retry 2 times on failure
    retryDelay: 1000, // Wait 1 second between retries
    throwOnError: false, // Don't throw errors, return them instead
  });
}

/**
 * React Query hook to fetch a single vehicle by ID
 */
export function useVehicle(id: string) {
  return useQuery<Vehicle>({
    queryKey: ["vehicles", id],
    queryFn: () => fetchVehicleById(id),
    enabled: !!id,
    staleTime: 30 * 60 * 1000, // 30 minutes
    gcTime: 60 * 60 * 1000, // 1 hour
  });
}
