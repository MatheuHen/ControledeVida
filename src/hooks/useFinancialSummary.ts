"use client";

import { useQuery } from "@tanstack/react-query";
import { transactionsService } from "@/services/transactions.service";
import { normalizeRangeKey } from "@/lib/period";

export type FinancialSummary = {
  totalIncome: number;
  totalExpenses: number;
  balance: number;
};

export function useFinancialSummary(
  userId: string,
  dateFrom?: string,
  dateTo?: string,
) {
  const rangeKey = dateFrom && dateTo
    ? normalizeRangeKey({ from: new Date(dateFrom), to: new Date(dateTo) })
    : null;

  return useQuery({
    queryKey: ["financial-summary", userId, rangeKey],
    queryFn: async (): Promise<FinancialSummary> => {
      const transactions = await transactionsService.getAll(userId, {
        dateFrom,
        dateTo,
      });

      const totalIncome = transactions
        .filter((t) => t.type === "income" && t.status !== "cancelled")
        .reduce((sum, t) => sum + t.amount, 0);

      const totalExpenses = transactions
        .filter((t) => t.type === "expense" && t.status !== "cancelled")
        .reduce((sum, t) => sum + t.amount, 0);

      return {
        totalIncome,
        totalExpenses,
        balance: totalIncome - totalExpenses,
      };
    },
    enabled: Boolean(userId),
    staleTime: 1000 * 60 * 5,
  });
}
