"use client";

import Link from "next/link";
import { LogOut, PanelLeftClose } from "lucide-react";
import { APP_NAME, appRoutes } from "@/components/app-shell.config";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useLogout } from "@/hooks/useLogout";
import { useActiveUser } from "@/hooks/useActiveUser";
import { cn } from "@/lib/utils";

// Map route href -> canView flag key
const routePermissionMap: Record<string, keyof ReturnType<typeof useActiveUser> | null> = {
  "/": "canViewDashboard",
  "/finances": "canViewFinances",
  "/categories": "canViewCategories",
  "/goals": "canViewGoals",
  "/savings": "canViewSavings",
  "/emergency": "canViewEmergency",
  "/investments": "canViewInvestments",
  "/life-cost": "canViewLifeCost",
  "/analytics": "canViewAnalytics",
  // Always visible routes
  "/global": null,
  "/shared": null,
  "/settings": null,
};

function SidebarContent({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate?: () => void;
}) {
  const logout = useLogout();
  const activeUser = useActiveUser();

  const visibleRoutes = appRoutes.filter((route) => {
    const permKey = routePermissionMap[route.href];
    if (permKey === null || permKey === undefined) return true;
    return Boolean(activeUser[permKey]);
  });

  return (
    <div className="flex h-full flex-col bg-[linear-gradient(180deg,#020617_0%,#06131f_100%)] text-sidebar-foreground">
      <div className="border-b border-white/10 px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-400/20 text-emerald-300">
            <PanelLeftClose className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-medium text-emerald-300">Controle financeiro</p>
            <h2 className="text-lg font-semibold">{APP_NAME}</h2>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1.5">
          {visibleRoutes.map((route) => {
            const isActive = pathname === route.href;
            const Icon = route.icon;

            return (
              <Link
                key={route.href}
                href={route.href}
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-sidebar-muted hover:bg-white/8 hover:text-sidebar-foreground",
                  isActive &&
                    "bg-emerald-400/14 text-sidebar-foreground shadow-[inset_0_0_0_1px_rgba(52,211,153,0.18)]",
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{route.title}</span>
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      <div className="border-t border-white/10 p-4">
        <Button
          variant="outline"
          className="w-full justify-start border-white/10 bg-white/5 text-sidebar-foreground hover:bg-white/10"
          onClick={() => logout.mutate()}
          disabled={logout.isPending}
        >
          <LogOut className="mr-2 h-4 w-4" />
          {logout.isPending ? "Saindo..." : "Logout"}
        </Button>
      </div>
    </div>
  );
}

export function Sidebar({
  pathname,
  mobileOpen,
  onMobileOpenChange,
}: {
  pathname: string;
  mobileOpen: boolean;
  onMobileOpenChange: (open: boolean) => void;
}) {
  return (
    <>
      <aside className="hidden h-screen w-[250px] shrink-0 border-r border-white/5 lg:block">
        <SidebarContent pathname={pathname} />
      </aside>

      <Sheet open={mobileOpen} onOpenChange={onMobileOpenChange}>
        <SheetContent side="left" className="w-[250px] p-0 lg:hidden">
          <SheetHeader className="sr-only">
            <SheetTitle>Menu principal</SheetTitle>
            <SheetDescription>Navegação principal do aplicativo.</SheetDescription>
          </SheetHeader>
          <SidebarContent
            pathname={pathname}
            onNavigate={() => onMobileOpenChange(false)}
          />
        </SheetContent>
      </Sheet>
    </>
  );
}
