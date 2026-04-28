"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Loader2, X } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn, formatCurrency } from "@/lib/utils";
import { parseCommand } from "@/lib/chat-parser";
import { getInsights } from "@/agents/agent-orchestrator";
import { useChat } from "./ChatProvider";
import { ChatMessage as ChatMessageComp } from "./ChatMessage";
import { ChatPreview } from "./ChatPreview";
import { useActiveUser } from "@/hooks/useActiveUser";
import { useCategories } from "@/hooks/useCategories";
import { useTransactions, useCreateTransaction } from "@/hooks/useTransactions";
import { useCreateCategory } from "@/hooks/useCategories";
import { useCreateGoal } from "@/hooks/useGoals";
import { useCreateReserveEntry } from "@/hooks/useReserveEntries";
import { useCreateInvestmentEntry } from "@/hooks/useInvestmentEntries";
import { useFinancialSummary } from "@/hooks/useFinancialSummary";
import { useGoals } from "@/hooks/useGoals";
import { useReserveEntries } from "@/hooks/useReserveEntries";
import { useInvestmentEntries } from "@/hooks/useInvestmentEntries";
import { useProfile } from "@/hooks/useProfile";
import { getDateRange } from "@/lib/period";
import { format as dateFnsFormat } from "date-fns";
import type { ParsedCommand } from "@/lib/chat-parser";

import { motion, AnimatePresence } from "framer-motion";

export function ChatWindow() {
  const {
    messages,
    isOpen,
    closeChat,
    sendMessage,
    addSystemMessage,
    pendingAction,
    setPendingAction,
  } = useChat();

  const [input, setInput] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { activeUserId } = useActiveUser();
  const userId = activeUserId ?? "";

  // Period for queries
  const range = getDateRange("month");
  const dateFrom = dateFnsFormat(range.from, "yyyy-MM-dd");
  const dateTo = dateFnsFormat(range.to, "yyyy-MM-dd");

  // Data hooks
  const { data: categories = [] } = useCategories(userId);
  const { data: transactions = [] } = useTransactions(userId, { dateFrom, dateTo });
  const { data: summary } = useFinancialSummary(userId, dateFrom, dateTo);
  const { data: goals = [] } = useGoals(userId);
  const { data: reserveEntries = [] } = useReserveEntries(userId);
  const { data: investmentEntries = [] } = useInvestmentEntries(userId);
  const { data: profile } = useProfile();

  // Mutation hooks
  const createTransaction = useCreateTransaction(userId);
  const createCategory = useCreateCategory(userId);
  const createGoal = useCreateGoal(userId);
  const createReserveEntry = useCreateReserveEntry(userId);
  const createInvestmentEntry = useCreateInvestmentEntry(userId);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      inputRef.current?.focus();
    }
  }, [isOpen, messages]);

  async function handleSend() {
    const text = input.trim();
    if (!text || isProcessing) return;
    setInput("");

    const parsed = parseCommand(text, categories);
    sendMessage(text, parsed);

    // If it's a query, resolve immediately
    if (
      parsed.intent === "query_finances" ||
      parsed.intent === "query_investments" ||
      parsed.intent === "query_general"
    ) {
      setIsProcessing(true);
      await new Promise((r) => setTimeout(r, 400));

      if (parsed.intent === "query_finances" && summary) {
        const lines = [
          `Resumo do mês atual:`,
          `• Receitas: ${formatCurrency(summary.totalIncome)}`,
          `• Despesas: ${formatCurrency(summary.totalExpenses)}`,
          `• Saldo: ${formatCurrency(summary.balance)}`,
        ];
        addSystemMessage(lines.join("\n"));
      } else if (parsed.intent === "query_investments") {
        const total = investmentEntries.reduce((s, e) => s + e.value, 0);
        const current = investmentEntries.reduce((s, e) => s + (e.current_value ?? e.value), 0);
        const pl = current - total;
        addSystemMessage(
          investmentEntries.length === 0
            ? "Você não tem investimentos registrados ainda."
            : `Seus investimentos:\n• Investido: ${formatCurrency(total)}\n• Valor atual: ${formatCurrency(current)}\n• Resultado: ${pl >= 0 ? "+" : ""}${formatCurrency(pl)}`,
        );
      } else {
        // query_general — use agent orchestrator
        const agentCtx = {
          userId,
          viewingMode: "own" as const,
          permissions: ["finances", "investments", "goals"],
          period: range,
          transactions,
          categories,
          goals,
          reserveEntries,
          investmentEntries,
          profile: profile ?? null,
          financialSummary: {
            totalIncome: summary?.totalIncome ?? 0,
            totalExpenses: summary?.totalExpenses ?? 0,
            balance: summary?.balance ?? 0,
          },
        };
        const insights = getInsights(agentCtx, 3);
        if (insights.length > 0) {
          addSystemMessage(
            insights
              .map((i) => `${i.title}: ${i.message}`)
              .join("\n\n"),
          );
        } else {
          addSystemMessage("Não encontrei informações específicas para essa consulta. Tente perguntar sobre gastos, investimentos ou saldo.");
        }
      }

      setIsProcessing(false);
      return;
    }

    if (parsed.intent !== "unknown") {
      setPendingAction(parsed);
    } else {
      addSystemMessage("Não entendi o comando. Tente algo como:\n• \"Gastei R$ 50 no mercado\"\n• \"Cria categoria Alimentação\"\n• \"Meta de R$ 1000\"\n• \"Quanto gastei esse mês?\"");
    }
  }

  async function handleConfirm() {
    if (!pendingAction || !userId) return;
    const action = pendingAction;
    setPendingAction(null);
    setIsProcessing(true);

    try {
      const today = dateFnsFormat(new Date(), "yyyy-MM-dd");

      switch (action.intent) {
        case "create_transaction": {
          const data = action.data;
          await createTransaction.mutateAsync({
            user_id: userId,
            type: (data.type as "income" | "expense") ?? "expense",
            amount: (data.amount as number) ?? 0,
            description: (data.description as string) ?? "Lançamento via chat",
            due_date: (data.date as string) ?? today,
            category_id: (data.category_id as string) ?? null,
            status: "paid",
            payment_date: today,
            payment_method: null,
            is_recurring: false,
            recurrence_type: null,
            recurrence_interval: null,
            recurrence_source_id: null,
            recurrence_start_date: null,
            recurrence_end_date: null,
            notes: null,
          });
          addSystemMessage("Transação criada com sucesso!");
          break;
        }
        case "create_category": {
          await createCategory.mutateAsync({
            user_id: userId,
            name: (action.data.name as string) ?? "Nova categoria",
            type: "expense",
            color: null,
            icon: null,
          });
          addSystemMessage(`Categoria "${action.data.name}" criada!`);
          break;
        }
        case "create_goal": {
          await createGoal.mutateAsync({
            user_id: userId,
            name: (action.data.name as string) ?? "Nova meta",
            type: "economy",
            target_amount: (action.data.target_amount as number) ?? 0,
            current_amount: 0,
            start_date: today,
            end_date: dateFnsFormat(
              new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
              "yyyy-MM-dd",
            ),
            status: "active",
            description: null,
          });
          addSystemMessage(`Meta "${action.data.name}" criada com sucesso!`);
          break;
        }
        case "add_reserve": {
          await createReserveEntry.mutateAsync({
            user_id: userId,
            amount: action.data.amount as number,
            type: (action.data.type as "deposit" | "withdrawal") ?? "deposit",
            description: "Lançamento via chat",
            date: today,
          });
          addSystemMessage(
            `${action.data.type === "withdrawal" ? "Retirada" : "Depósito"} de ${formatCurrency(action.data.amount as number)} na reserva registrado!`,
          );
          break;
        }
        case "add_investment": {
          await createInvestmentEntry.mutateAsync({
            user_id: userId,
            value: action.data.value as number,
            current_value: action.data.value as number,
            category: action.data.category as string,
            description: "Lançamento via chat",
            date: today,
          });
          addSystemMessage(
            `Investimento de ${formatCurrency(action.data.value as number)} em "${action.data.category}" registrado!`,
          );
          break;
        }
      }
    } catch {
      addSystemMessage("Erro ao processar a ação. Tente novamente.");
    } finally {
      setIsProcessing(false);
    }
  }

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 16, scale: 0.96 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="fixed bottom-24 right-6 z-50 flex h-[500px] w-[380px] flex-col overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/95 backdrop-blur-xl shadow-2xl"
      style={{ maxHeight: "80vh" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div>
          <h3 className="text-sm font-semibold text-zinc-100">Assistente Financeiro</h3>
          <p className="text-xs text-zinc-500">Lançamentos e consultas por texto</p>
        </div>
        <button
          onClick={closeChat}
          className="rounded-lg p-1.5 text-zinc-500 hover:bg-white/10 hover:text-zinc-300"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 && (
          <div className="text-center text-xs text-zinc-500 mt-4">
            <p className="mb-2 font-medium text-zinc-400">Como posso ajudar?</p>
            <p>• &quot;Gastei R$ 50 no mercado&quot;</p>
            <p>• &quot;Recebi R$ 3000 de salário&quot;</p>
            <p>• &quot;Investi R$ 500 em Tesouro Direto&quot;</p>
            <p>• &quot;Meta de R$ 2000 para viagem&quot;</p>
            <p>• &quot;Quanto gastei esse mês?&quot;</p>
          </div>
        )}
        {messages.map((msg) => (
          <ChatMessageComp key={msg.id} message={msg} />
        ))}
        {pendingAction && (
          <ChatPreview
            parsed={pendingAction}
            onConfirm={handleConfirm}
            onCancel={() => {
              setPendingAction(null);
              addSystemMessage("Ação cancelada.");
            }}
          />
        )}
        {isProcessing && (
          <div className="flex justify-start">
            <div className="flex items-center gap-2 rounded-2xl rounded-bl-sm bg-white/10 px-4 py-2.5 text-sm text-zinc-400">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Processando...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-white/10 p-3">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
            placeholder="Descreva o lançamento..."
            className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:border-emerald-500/50 focus:outline-none"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isProcessing}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-600 text-white transition-colors hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
