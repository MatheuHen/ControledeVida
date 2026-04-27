"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { signIn } from "@/services/auth.service";
import { sessionQueryKey } from "@/hooks/useSession";

type LoginInput = {
  email: string;
  password: string;
};

export function useLogin() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ email, password }: LoginInput) => signIn(email, password),
    onSuccess: async (session) => {
      queryClient.setQueryData(sessionQueryKey, session);
      await queryClient.invalidateQueries({ queryKey: ["profile"] });
      router.replace("/");
    },
  });
}