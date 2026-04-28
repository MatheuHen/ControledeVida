"use client";

import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { ChatMessage as ChatMessageType } from "./ChatProvider";

interface ChatMessageProps {
  message: ChatMessageType;
}

const TYPE_COLORS: Record<string, string> = {
  positive: "text-emerald-400",
  warning: "text-yellow-400",
  negative: "text-red-400",
  neutral: "text-zinc-400",
};

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";
  const timeStr = format(message.timestamp, "HH:mm", { locale: ptBR });

  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm",
          isUser
            ? "rounded-br-sm bg-emerald-600 text-white"
            : "rounded-bl-sm bg-white/10 text-zinc-200",
        )}
      >
        <p className="whitespace-pre-wrap break-words">{message.text}</p>
        <p
          className={cn(
            "mt-1 text-right text-[10px]",
            isUser ? "text-emerald-200/70" : "text-zinc-500",
          )}
        >
          {timeStr}
        </p>
      </div>
    </div>
  );
}
