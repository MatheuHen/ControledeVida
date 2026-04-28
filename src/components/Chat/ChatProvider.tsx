"use client";

import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useReducer,
  useRef,
} from "react";
import type { ParsedCommand } from "@/lib/chat-parser";

export type MessageRole = "user" | "system";

export interface ChatMessage {
  id: string;
  role: MessageRole;
  text: string;
  timestamp: Date;
  parsed?: ParsedCommand;
  isPreview?: boolean;
}

type ChatState = {
  messages: ChatMessage[];
  isOpen: boolean;
  pendingAction: ParsedCommand | null;
};

type ChatAction =
  | { type: "TOGGLE" }
  | { type: "OPEN" }
  | { type: "CLOSE" }
  | { type: "ADD_MESSAGE"; message: ChatMessage }
  | { type: "SET_PENDING"; action: ParsedCommand | null };

function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case "TOGGLE":
      return { ...state, isOpen: !state.isOpen };
    case "OPEN":
      return { ...state, isOpen: true };
    case "CLOSE":
      return { ...state, isOpen: false };
    case "ADD_MESSAGE":
      return { ...state, messages: [...state.messages, action.message] };
    case "SET_PENDING":
      return { ...state, pendingAction: action.action };
    default:
      return state;
  }
}

type ChatContextValue = {
  messages: ChatMessage[];
  isOpen: boolean;
  pendingAction: ParsedCommand | null;
  toggleChat: () => void;
  openChat: () => void;
  closeChat: () => void;
  sendMessage: (text: string, parsed?: ParsedCommand) => void;
  addSystemMessage: (text: string) => void;
  setPendingAction: (action: ParsedCommand | null) => void;
};

const ChatContext = createContext<ChatContextValue | undefined>(undefined);

let msgCounter = 0;
function genId() {
  return `msg-${++msgCounter}-${Date.now()}`;
}

export function ChatProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(chatReducer, {
    messages: [],
    isOpen: false,
    pendingAction: null,
  });

  const toggleChat = useCallback(() => dispatch({ type: "TOGGLE" }), []);
  const openChat = useCallback(() => dispatch({ type: "OPEN" }), []);
  const closeChat = useCallback(() => dispatch({ type: "CLOSE" }), []);

  const sendMessage = useCallback((text: string, parsed?: ParsedCommand) => {
    const msg: ChatMessage = {
      id: genId(),
      role: "user",
      text,
      timestamp: new Date(),
      parsed,
    };
    dispatch({ type: "ADD_MESSAGE", message: msg });
  }, []);

  const addSystemMessage = useCallback((text: string) => {
    const msg: ChatMessage = {
      id: genId(),
      role: "system",
      text,
      timestamp: new Date(),
    };
    dispatch({ type: "ADD_MESSAGE", message: msg });
  }, []);

  const setPendingAction = useCallback((action: ParsedCommand | null) => {
    dispatch({ type: "SET_PENDING", action });
  }, []);

  return (
    <ChatContext.Provider
      value={{
        messages: state.messages,
        isOpen: state.isOpen,
        pendingAction: state.pendingAction,
        toggleChat,
        openChat,
        closeChat,
        sendMessage,
        addSystemMessage,
        setPendingAction,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat must be used within ChatProvider");
  return ctx;
}
