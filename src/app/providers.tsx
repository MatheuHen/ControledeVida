"use client";

import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { ThemeProvider } from "@/components/ThemeProvider";
import { getSession, onAuthStateChange } from "@/services/auth.service";
import { sessionQueryKey } from "@/hooks/useSession";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
  );

  useEffect(() => {
    let isMounted = true;

    getSession()
      .then((session) => {
        if (isMounted) {
          queryClient.setQueryData(sessionQueryKey, session);
        }
      })
      .catch(() => {
        if (isMounted) {
          queryClient.setQueryData(sessionQueryKey, null);
        }
      });

    const unsubscribe = onAuthStateChange((_event, session) => {
      queryClient.setQueryData(sessionQueryKey, session);

      if (session?.user.id) {
        queryClient.invalidateQueries({ queryKey: ["profile", session.user.id] });
        return;
      }

      queryClient.removeQueries({ queryKey: ["profile"] });
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AppShell>{children}</AppShell>
      </ThemeProvider>
    </QueryClientProvider>
  );
}