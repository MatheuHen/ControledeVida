"use client";

import { useQuery } from "@tanstack/react-query";
import { getProfile } from "@/services/auth.service";
import { useSession } from "@/hooks/useSession";

export function useProfile() {
  const { data: session } = useSession();
  const userId = session?.user.id;

  return useQuery({
    queryKey: ["profile", userId],
    queryFn: () => getProfile(userId!),
    enabled: Boolean(userId),
    staleTime: 1000 * 60 * 5,
  });
}