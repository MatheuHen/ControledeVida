"use client";

import { MessageCircle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useChat } from "./ChatProvider";

export function ChatButton() {
  const { isOpen, toggleChat, messages } = useChat();

  const unreadCount = messages.filter((m) => m.role === "system").length;

  return (
    <button
      onClick={toggleChat}
      aria-label={isOpen ? "Fechar chat" : "Abrir chat"}
      className={cn(
        "fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all duration-200",
        isOpen
          ? "bg-zinc-700 hover:bg-zinc-600"
          : "bg-emerald-600 hover:bg-emerald-500",
      )}
    >
      {isOpen ? (
        <X className="h-6 w-6 text-white" />
      ) : (
        <>
          <MessageCircle className="h-6 w-6 text-white" />
          {unreadCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </>
      )}
    </button>
  );
}
