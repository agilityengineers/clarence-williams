import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/api";
import type { LayoutData } from "@/lib/types";

/** Shared shell data (nav pages + settings + footer content). */
export function useLayoutData() {
  return useQuery({
    queryKey: ["layout"],
    queryFn: () => apiGet<LayoutData>("/public/layout"),
    staleTime: 60_000,
  });
}
