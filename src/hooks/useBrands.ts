import { useQuery } from "@tanstack/react-query";
import { fetchBrands } from "@/lib/api/brands";

export function useBrands() {
  return useQuery<string[]>({
    queryKey: ["brands"],
    queryFn: fetchBrands,
    staleTime: 24 * 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    retry: 1,
  });
}
