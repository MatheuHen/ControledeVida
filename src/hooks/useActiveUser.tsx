"use client";

import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { useSession } from "@/hooks/useSession";

export type AppModule =
  | "dashboard"
  | "finances"
  | "categories"
  | "goals"
  | "savings"
  | "emergency"
  | "investments"
  | "life-cost"
  | "analytics";

export const ALL_MODULES: AppModule[] = [
  "dashboard",
  "finances",
  "categories",
  "goals",
  "savings",
  "emergency",
  "investments",
  "life-cost",
  "analytics",
];

type ActiveUserContextValue = {
  activeUserId: string | null;
  ownUserId: string | null;
  isSharedView: boolean;
  viewingMode: "own" | "shared";
  permissions: string[];
  canViewDashboard: boolean;
  canViewFinances: boolean;
  canViewCategories: boolean;
  canViewGoals: boolean;
  canViewSavings: boolean;
  canViewEmergency: boolean;
  canViewInvestments: boolean;
  canViewLifeCost: boolean;
  canViewAnalytics: boolean;
  setSharedContext: (userId: string, permissions: string[]) => void;
  clearSharedContext: () => void;
};

const ActiveUserContext = createContext<ActiveUserContextValue | undefined>(
  undefined,
);

export function ActiveUserProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession();
  const ownUserId = session?.user.id ?? null;

  const [sharedContext, setSharedContextState] = useState<{
    userId: string;
    permissions: string[];
  } | null>(null);

  const setSharedContext = useCallback(
    (userId: string, permissions: string[]) => {
      setSharedContextState({ userId, permissions });
    },
    [],
  );

  const clearSharedContext = useCallback(() => {
    setSharedContextState(null);
  }, []);

  const value = useMemo<ActiveUserContextValue>(() => {
    const isSharedView = Boolean(sharedContext);
    const permissions = sharedContext?.permissions ?? [];

    const canView = (module: AppModule) =>
      !isSharedView || permissions.includes(module);

    return {
      activeUserId: sharedContext?.userId ?? ownUserId,
      ownUserId,
      isSharedView,
      viewingMode: isSharedView ? "shared" : "own",
      permissions,
      canViewDashboard: canView("dashboard"),
      canViewFinances: canView("finances"),
      canViewCategories: canView("categories"),
      canViewGoals: canView("goals"),
      canViewSavings: canView("savings"),
      canViewEmergency: canView("emergency"),
      canViewInvestments: canView("investments"),
      canViewLifeCost: canView("life-cost"),
      canViewAnalytics: canView("analytics"),
      setSharedContext,
      clearSharedContext,
    };
  }, [sharedContext, ownUserId, setSharedContext, clearSharedContext]);

  return (
    <ActiveUserContext.Provider value={value}>
      {children}
    </ActiveUserContext.Provider>
  );
}

export function useActiveUser() {
  const context = useContext(ActiveUserContext);
  if (!context) {
    throw new Error("useActiveUser must be used within ActiveUserProvider");
  }
  return context;
}
