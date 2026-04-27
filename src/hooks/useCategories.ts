"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  categoriesService,
  type CreateCategoryData,
  type UpdateCategoryData,
} from "@/services/categories.service";

export function useCategories(userId: string) {
  return useQuery({
    queryKey: ["categories", userId],
    queryFn: () => categoriesService.getAll(userId),
    enabled: Boolean(userId),
    staleTime: 1000 * 60 * 10,
  });
}

export function useCreateCategory(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCategoryData) => categoriesService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories", userId] });
    },
  });
}

export function useUpdateCategory(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCategoryData }) =>
      categoriesService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories", userId] });
    },
  });
}

export function useDeleteCategory(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => categoriesService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories", userId] });
    },
  });
}
