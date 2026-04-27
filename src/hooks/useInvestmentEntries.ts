"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  investmentEntriesService,
  type CreateInvestmentEntryData,
  type UpdateInvestmentEntryData,
} from "@/services/investment-entries.service";

export function useInvestmentEntries(userId: string) {
  return useQuery({
    queryKey: ["investment-entries", userId],
    queryFn: () => investmentEntriesService.getAll(userId),
    enabled: Boolean(userId),
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreateInvestmentEntry(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateInvestmentEntryData) =>
      investmentEntriesService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["investment-entries", userId],
      });
    },
  });
}

export function useUpdateInvestmentEntry(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdateInvestmentEntryData;
    }) => investmentEntriesService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["investment-entries", userId],
      });
    },
  });
}

export function useDeleteInvestmentEntry(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => investmentEntriesService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["investment-entries", userId],
      });
    },
  });
}
