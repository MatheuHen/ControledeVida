"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Users, X } from "lucide-react";
import { useActiveUser } from "@/hooks/useActiveUser";
import { useMyShares, useSharedWithMe } from "@/hooks/useShared";
import { useSession } from "@/hooks/useSession";
import { cn } from "@/lib/utils";

export function SharedContextBanner() {
  const { data: session } = useSession();
  const userId = session?.user.id ?? "";
  const { activeUserId, ownUserId, isSharedView, setSharedContext, clearSharedContext } = useActiveUser();
  const queryClient = useQueryClient();

  const { data: sharedWithMe = [] } = useSharedWithMe(userId);
  const acceptedShares = sharedWithMe.filter((s) => s.status === "accepted");

  function handleSwitch(targetId: string | null) {
    queryClient.clear();
    if (!targetId) {
      clearSharedContext();
    } else {
      const share = acceptedShares.find((s) => s.owner_id === targetId);
      if (!share) return;
      const perm = share.permission_level;
      setSharedContext(targetId, {
        canViewFinances: perm === "full" || perm === "finances",
        canViewInvestments: perm === "full" || perm === "investments",
        canViewReserve: perm === "full",
      });
    }
  }

  if (acceptedShares.length === 0 && !isSharedView) return null;

  return (
    <div className={cn(
      "flex flex-wrap items-center gap-2 rounded-xl border px-4 py-2 text-sm",
      isSharedView
        ? "border-yellow-500/30 bg-yellow-500/10 text-yellow-200"
        : "border-white/10 bg-white/5 text-zinc-400",
    )}>
      <Users className="h-4 w-4 shrink-0" />

      {isSharedView ? (
        <>
          <span>Visualizando dados compartilhados</span>
          <button
            onClick={() => handleSwitch(null)}
            className="ml-auto flex items-center gap-1 rounded-lg border border-yellow-500/30 px-2 py-0.5 text-xs text-yellow-300 transition-colors hover:bg-yellow-500/20"
          >
            <X className="h-3 w-3" />
            Voltar para meus dados
          </button>
        </>
      ) : (
        <>
          <span>Visualizar como:</span>
          <button
            onClick={() => handleSwitch(null)}
            className={cn(
              "rounded-lg px-2 py-0.5 text-xs transition-colors",
              !isSharedView && activeUserId === ownUserId
                ? "bg-emerald-500 text-white"
                : "text-zinc-400 hover:text-zinc-200",
            )}
          >
            Meus dados
          </button>
          {acceptedShares.map((share) => (
            <button
              key={share.id}
              onClick={() => handleSwitch(share.owner_id)}
              className={cn(
                "rounded-lg px-2 py-0.5 text-xs transition-colors",
                activeUserId === share.owner_id
                  ? "bg-emerald-500 text-white"
                  : "text-zinc-400 hover:text-zinc-200",
              )}
            >
              {share.target_user_email}
            </button>
          ))}
        </>
      )}
    </div>
  );
}
