"use client";

import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { Header } from "@/components/Header";
import { SharedContextBanner } from "@/components/SharedContextBanner";
import { publicRoutes } from "@/components/app-shell.config";
import { Sidebar } from "@/components/Sidebar";
import { useSession } from "@/hooks/useSession";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session, isLoading } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);

  const isPublicRoute = useMemo(
    () => publicRoutes.has(pathname ?? ""),
    [pathname],
  );

  if (isPublicRoute || !session) {
    if (isPublicRoute) {
      return <>{children}</>;
    }

    if (isLoading) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
          Carregando layout...
        </div>
      );
    }

    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SharedContextBanner />
      <div className="flex min-h-screen">
        <Sidebar
          pathname={pathname}
          mobileOpen={mobileOpen}
          onMobileOpenChange={setMobileOpen}
        />
        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <Header pathname={pathname} onOpenMobileMenu={() => setMobileOpen(true)} />
          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
            <div className="mx-auto w-full max-w-7xl">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}