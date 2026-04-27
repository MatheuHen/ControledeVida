"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  sharedService,
  type CreateSharedAccessData,
} from "@/services/shared.service";

export function useSharedWithMe(userId: string) {
  return useQuery({
    queryKey: ["shared-with-me", userId],
    queryFn: () => sharedService.getSharedWithMe(userId),
    enabled: Boolean(userId),
    staleTime: 1000 * 60 * 5,
  });
}

export function useMyShares(userId: string) {
  return useQuery({
    queryKey: ["my-shares", userId],
    queryFn: () => sharedService.getMyShares(userId),
    enabled: Boolean(userId),
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreateInvite(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateSharedAccessData) =>
      sharedService.createInvite(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-shares", userId] });
    },
  });
}

export function useAcceptInvite(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => sharedService.acceptInvite(id, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shared-with-me", userId] });
    },
  });
}

export function useRevokeAccess(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => sharedService.revokeAccess(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-shares", userId] });
      queryClient.invalidateQueries({ queryKey: ["shared-with-me", userId] });
    },
  });
}
