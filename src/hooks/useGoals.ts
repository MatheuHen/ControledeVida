"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  goalsService,
  type CreateGoalData,
  type UpdateGoalData,
} from "@/services/goals.service";

export function useGoals(userId: string) {
  return useQuery({
    queryKey: ["goals", userId],
    queryFn: () => goalsService.getAll(userId),
    enabled: Boolean(userId),
    staleTime: 1000 * 60 * 5,
  });
}

export function useCreateGoal(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateGoalData) => goalsService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals", userId] });
    },
  });
}

export function useUpdateGoal(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateGoalData }) =>
      goalsService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals", userId] });
    },
  });
}

export function useDeleteGoal(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => goalsService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals", userId] });
    },
  });
}
