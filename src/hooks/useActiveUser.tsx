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

type ActiveUserContextValue = {
  activeUserId: string | null;
  ownUserId: string | null;
  isSharedView: boolean;
  canViewFinances: boolean;
  canViewInvestments: boolean;
  canViewReserve: boolean;
  setSharedContext: (
    userId: string,
    permissions: {
      canViewFinances: boolean;
      canViewInvestments: boolean;
      canViewReserve: boolean;
    },
  ) => void;
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
    canViewFinances: boolean;
    canViewInvestments: boolean;
    canViewReserve: boolean;
  } | null>(null);

  const setSharedContext = useCallback(
    (
      userId: string,
      permissions: {
        canViewFinances: boolean;
        canViewInvestments: boolean;
        canViewReserve: boolean;
      },
    ) => {
      setSharedContextState({ userId, ...permissions });
    },
    [],
  );

  const clearSharedContext = useCallback(() => {
    setSharedContextState(null);
  }, []);

  const value = useMemo<ActiveUserContextValue>(
    () => ({
      activeUserId: sharedContext?.userId ?? ownUserId,
      ownUserId,
      isSharedView: Boolean(sharedContext),
      canViewFinances: sharedContext?.canViewFinances ?? true,
      canViewInvestments: sharedContext?.canViewInvestments ?? true,
      canViewReserve: sharedContext?.canViewReserve ?? true,
      setSharedContext,
      clearSharedContext,
    }),
    [sharedContext, ownUserId, setSharedContext, clearSharedContext],
  );

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
