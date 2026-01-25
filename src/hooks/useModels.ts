import { useQuery } from "@tanstack/react-query";
import { fetchModels } from "@/lib/api/models";

export function useModels(make: string) {
  return useQuery<string[]>({
    queryKey: ["models", make],
    queryFn: () => fetchModels(make),
    enabled: Boolean(make && make.trim().length >= 2),
    staleTime: 24 * 60 * 60 * 1000,
    gcTime: 24 * 60 * 60 * 1000,
    retry: 1,
  });
}
