"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  transactionsService,
  type CreateTransactionData,
  type TransactionFilters,
  type UpdateTransactionData,
} from "@/services/transactions.service";
import { normalizeRangeKey } from "@/lib/period";

function transactionQueryKey(
  userId: string,
  filters?: TransactionFilters,
) {
  const rangeKey =
    filters?.dateFrom && filters?.dateTo
      ? normalizeRangeKey({
          from: new Date(filters.dateFrom),
          to: new Date(filters.dateTo),
        })
      : null;
  return ["transactions", userId, rangeKey, filters?.type, filters?.status, filters?.categoryId] as const;
}

export function useTransactions(userId: string, filters?: TransactionFilters) {
  return useQuery({
    queryKey: transactionQueryKey(userId, filters),
    queryFn: () => transactionsService.getAll(userId, filters),
    enabled: Boolean(userId),
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreateTransaction(userId: string, filters?: TransactionFilters) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateTransactionData) => transactionsService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions", userId] });
    },
  });
}

export function useUpdateTransaction(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateTransactionData }) =>
      transactionsService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions", userId] });
    },
  });
}

export function useDeleteTransaction(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => transactionsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions", userId] });
    },
  });
}
