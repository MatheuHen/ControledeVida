"use client";

import { useQuery } from "@tanstack/react-query";
import { transactionsService } from "@/services/transactions.service";
import { format } from "date-fns";

export function useUpcomingTransactions(userId: string, daysAhead = 30) {
  const today = format(new Date(), "yyyy-MM-dd");
  const future = format(
    new Date(Date.now() + daysAhead * 24 * 60 * 60 * 1000),
    "yyyy-MM-dd",
  );

  return useQuery({
    queryKey: ["upcoming-transactions", userId, daysAhead],
    queryFn: () =>
      transactionsService.getAll(userId, {
        dateFrom: today,
        dateTo: future,
        status: "pending",
      }),
    enabled: Boolean(userId),
    staleTime: 1000 * 60 * 5,
  });
}
