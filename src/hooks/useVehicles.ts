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
