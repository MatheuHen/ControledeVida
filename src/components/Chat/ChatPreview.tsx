"use client";

import { Check, Pencil, X } from "lucide-react";
import { cn, formatCurrency } from "@/lib/utils";
import type { ParsedCommand } from "@/lib/chat-parser";

interface ChatPreviewProps {
  parsed: ParsedCommand;
  onConfirm: () => void;
  onCancel: () => void;
}

const INTENT_LABELS: Record<string, string> = {
  create_transaction: "Nova Transação",
  create_category: "Nova Categoria",
  create_goal: "Nova Meta",
  add_reserve: "Reserva de Emergência",
  add_investment: "Novo Investimento",
  query_finances: "Consulta Financeira",
  query_investments: "Consulta de Investimentos",
  query_general: "Consulta Geral",
  unknown: "Comando Não Reconhecido",
};

const CONFIDENCE_COLORS: Record<string, string> = {
  high: "text-emerald-400",
  low: "text-yellow-400",
};

function DataRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-xs text-zinc-500">{label}</span>
      <span className="text-xs font-medium text-zinc-200">{value}</span>
    </div>
  );
}

export function ChatPreview({ parsed, onConfirm, onCancel }: ChatPreviewProps) {
  const { intent, data, confidence } = parsed;
  const isActionable =
    intent !== "query_finances" &&
    intent !== "query_investments" &&
    intent !== "query_general" &&
    intent !== "unknown";

  return (
    <div className="mx-2 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm">
      <div className="mb-3 flex items-center justify-between">
        <span className="font-medium text-zinc-200">{INTENT_LABELS[intent] ?? intent}</span>
        <span className={cn("text-xs", CONFIDENCE_COLORS[confidence])}>
          {confidence === "high" ? "Alta confiança" : "Baixa confiança"}
        </span>
      </div>

      <div className="space-y-1.5">
        {/* Transaction */}
        {intent === "create_transaction" && (() => {
          const txType = data.type as string | undefined;
          const txAmount = data.amount as number | null | undefined;
          const txDate = data.date as string | null | undefined;
          const txWarnings = data.warnings as string[] | undefined;
          return (
            <>
              {txType && (
                <DataRow
                  label="Tipo"
                  value={
                    <span className={txType === "income" ? "text-emerald-400" : "text-red-400"}>
                      {txType === "income" ? "Receita" : "Despesa"}
                    </span>
                  }
                />
              )}
              {txAmount != null && (
                <DataRow label="Valor" value={formatCurrency(txAmount)} />
              )}
              {txDate && <DataRow label="Data" value={txDate} />}
              {txWarnings?.map((w, i) => (
                <p key={i} className="text-xs text-yellow-400">
                  ⚠ {w}
                </p>
              ))}
            </>
          );
        })()}

        {/* Category */}
        {intent === "create_category" && data.name != null && (
          <DataRow label="Nome" value={data.name as string} />
        )}

        {/* Goal */}
        {intent === "create_goal" && (() => {
          const gName = data.name as string | undefined;
          const gAmount = data.target_amount as number | null | undefined;
          return (
            <>
              {gName && <DataRow label="Nome" value={gName} />}
              {gAmount != null && (
                <DataRow label="Valor" value={formatCurrency(gAmount)} />
              )}
            </>
          );
        })()}

        {/* Reserve */}
        {intent === "add_reserve" && (() => {
          const rAmount = data.amount as number | null | undefined;
          const rType = data.type as string | undefined;
          return (
            <>
              {rAmount != null && (
                <DataRow label="Valor" value={formatCurrency(rAmount)} />
              )}
              {rType && (
                <DataRow label="Tipo" value={rType === "deposit" ? "Depósito" : "Retirada"} />
              )}
            </>
          );
        })()}

        {/* Investment */}
        {intent === "add_investment" && (() => {
          const iValue = data.value as number | null | undefined;
          const iCat = data.category as string | undefined;
          return (
            <>
              {iValue != null && (
                <DataRow label="Valor" value={formatCurrency(iValue)} />
              )}
              {iCat && <DataRow label="Ativo" value={iCat} />}
            </>
          );
        })()}

        {/* Query */}
        {(intent === "query_finances" ||
          intent === "query_investments" ||
          intent === "query_general") && (
          <p className="text-xs text-zinc-400">Consultando seus dados financeiros...</p>
        )}
      </div>

      {isActionable && (
        <div className="mt-4 flex gap-2">
          <button
            onClick={onConfirm}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-emerald-500"
          >
            <Check className="h-3.5 w-3.5" />
            Confirmar
          </button>
          <button
            onClick={onCancel}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-white/10 px-3 py-2 text-xs font-medium text-zinc-300 transition-colors hover:bg-white/15"
          >
            <X className="h-3.5 w-3.5" />
            Cancelar
          </button>
        </div>
      )}
    </div>
  );
}
