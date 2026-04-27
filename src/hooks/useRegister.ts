"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { signUp } from "@/services/auth.service";
import { sessionQueryKey } from "@/hooks/useSession";

type RegisterInput = {
  fullName: string;
  email: string;
  password: string;
};

export function useRegister() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ fullName, email, password }: RegisterInput) =>
      signUp(email, password, fullName),
    onSuccess: ({ session, redirectTo }) => {
      queryClient.setQueryData(sessionQueryKey, session ?? null);
      router.replace(redirectTo);
    },
  });
}