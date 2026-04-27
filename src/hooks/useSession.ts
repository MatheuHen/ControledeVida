"use client";

import { useQuery } from "@tanstack/react-query";
import { getSession } from "@/services/auth.service";

export const sessionQueryKey = ["session"] as const;

export function useSession() {
  return useQuery({
    queryKey: sessionQueryKey,
    queryFn: getSession,
    staleTime: Infinity,
    gcTime: Infinity,
  });
}