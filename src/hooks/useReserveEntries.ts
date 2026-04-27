"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  reserveEntriesService,
  type CreateReserveEntryData,
  type UpdateReserveEntryData,
} from "@/services/reserve-entries.service";

export function useReserveEntries(userId: string) {
  return useQuery({
    queryKey: ["reserve-entries", userId],
    queryFn: () => reserveEntriesService.getAll(userId),
    enabled: Boolean(userId),
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreateReserveEntry(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateReserveEntryData) =>
      reserveEntriesService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reserve-entries", userId] });
    },
  });
}

export function useUpdateReserveEntry(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdateReserveEntryData;
    }) => reserveEntriesService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reserve-entries", userId] });
    },
  });
}

export function useDeleteReserveEntry(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => reserveEntriesService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reserve-entries", userId] });
    },
  });
}
