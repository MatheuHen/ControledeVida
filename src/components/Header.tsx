"use client";

import { Menu } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { getRouteMeta } from "@/components/app-shell.config";
import { Skeleton } from "@/components/ui/skeleton";
import { useProfile } from "@/hooks/useProfile";
import { useSession } from "@/hooks/useSession";

export function Header({
  pathname,
  onOpenMobileMenu,
}: {
  pathname: string;
  onOpenMobileMenu: () => void;
}) {
  const { title, description } = getRouteMeta(pathname);
  const { data: session } = useSession();
  const { data: profile, isLoading } = useProfile();

  const displayName = profile?.full_name || session?.user.email || "Usuário";

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-panel/80 backdrop-blur-xl">
      <div className="flex min-h-20 items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onOpenMobileMenu}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-background/40 text-foreground lg:hidden"
            aria-label="Abrir menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-semibold text-foreground sm:text-xl">
              {title}
            </h1>
            <p className="mt-1 hidden text-sm text-muted-foreground sm:block">
              {description}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <div className="hidden min-w-[180px] rounded-2xl border border-border bg-background/40 px-4 py-2 text-right sm:block">
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="ml-auto h-4 w-24" />
                <Skeleton className="ml-auto h-3 w-32" />
              </div>
            ) : (
              <>
                <p className="text-sm font-medium text-foreground">{displayName}</p>
                <p className="text-xs text-muted-foreground">
                  {session?.user.email ?? "Sessão autenticada"}
                </p>
              </>
            )}
          </div>
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-accent-foreground">
            <span className="text-sm font-semibold">
              {displayName.charAt(0).toUpperCase()}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}