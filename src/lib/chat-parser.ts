import type { Category } from "@/services/categories.service";
import { parseTransaction } from "@/lib/natural-transaction-parser";

export type ChatIntent =
  | "create_transaction"
  | "create_category"
  | "create_goal"
  | "add_reserve"
  | "add_investment"
  | "query_finances"
  | "query_investments"
  | "query_general"
  | "unknown";

export interface ParsedCommand {
  intent: ChatIntent;
  data: Record<string, unknown>;
  preview: string;
  confidence: "high" | "low";
}

// --- Intent detection patterns ---

const CATEGORY_PATTERNS = [
  /cria(?:r)?\s+categoria\s+(.+)/i,
  /nova\s+categoria\s+(.+)/i,
  /adiciona(?:r)?\s+categoria\s+(.+)/i,
];

const GOAL_PATTERNS = [
  /meta\s+de\s+R?\$?\s*([\d.,]+)/i,
  /criar?\s+meta\s+de?\s+R?\$?\s*([\d.,]+)/i,
  /(?:quero|preciso)\s+(?:juntar|poupar|economizar)\s+R?\$?\s*([\d.,]+)/i,
];

const RESERVE_PATTERNS = [
  /adiciona(?:r)?\s+R?\$?\s*([\d.,]+)\s+na\s+reserva/i,
  /deposita(?:r)?\s+R?\$?\s*([\d.,]+)\s+(?:na|na\s+minha)?\s*reserva/i,
  /retirar?\s+R?\$?\s*([\d.,]+)\s+da\s+reserva/i,
  /sacar?\s+R?\$?\s*([\d.,]+)\s+da\s+reserva/i,
  /reserva.*R?\$?\s*([\d.,]+)/i,
];

const INVESTMENT_PATTERNS = [
  /investi\s+R?\$?\s*([\d.,]+)\s+em\s+(.+)/i,
  /apliquei\s+R?\$?\s*([\d.,]+)\s+em\s+(.+)/i,
  /comprei\s+R?\$?\s*([\d.,]+)\s+em\s+(.+)/i,
  /novo\s+investimento\s+(?:de)?\s*R?\$?\s*([\d.,]+)\s+em\s+(.+)/i,
];

const QUERY_FINANCES_PATTERNS = [
  /quanto\s+gastei/i,
  /quanto\s+recebi/i,
  /qual\s+(?:é|foi)\s+meu\s+saldo/i,
  /meu\s+saldo/i,
  /minhas\s+(?:finanças|despesas|receitas)/i,
  /resumo\s+financeiro/i,
  /como\s+est(?:ão|á)\s+(?:minhas|meus)\s+(?:finanças|gastos)/i,
];

const QUERY_INVESTMENTS_PATTERNS = [
  /meus\s+investimentos/i,
  /como\s+est(?:ão|á)\s+(?:meus)\s+investimentos/i,
  /rendimento\s+dos\s+investimentos/i,
  /carteira\s+de\s+investimento/i,
];

function parseAmount(raw: string): number | null {
  const cleaned = raw.replace(/\./g, "").replace(",", ".");
  const value = parseFloat(cleaned);
  return isNaN(value) || value <= 0 ? null : value;
}

function detectReserveType(text: string): "deposit" | "withdrawal" {
  if (/retirar?|sacar?|resgate|retirei|saquei/i.test(text)) return "withdrawal";
  return "deposit";
}

export function parseCommand(text: string, categories: Category[]): ParsedCommand {
  const trimmed = text.trim();

  // --- create_category ---
  for (const pattern of CATEGORY_PATTERNS) {
    const match = trimmed.match(pattern);
    if (match) {
      const name = match[1].trim();
      return {
        intent: "create_category",
        data: { name },
        preview: `Criar categoria: "${name}"`,
        confidence: "high",
      };
    }
  }

  // --- create_goal ---
  for (const pattern of GOAL_PATTERNS) {
    const match = trimmed.match(pattern);
    if (match) {
      const amount = parseAmount(match[1]);
      if (amount) {
        // Try to extract goal name from text
        const nameMatch = trimmed.match(/(?:meta|objetivo|poupar|juntar|economizar)\s+(?:de\s+)?R?\$?[\d.,]+\s+(?:para|pra)?\s*(.+)?/i);
        const name = nameMatch?.[1]?.trim() || "Nova meta";
        return {
          intent: "create_goal",
          data: { target_amount: amount, name },
          preview: `Criar meta de R$ ${amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}${name !== "Nova meta" ? ` — "${name}"` : ""}`,
          confidence: "high",
        };
      }
    }
  }

  // --- add_reserve ---
  for (const pattern of RESERVE_PATTERNS) {
    const match = trimmed.match(pattern);
    if (match) {
      const amount = parseAmount(match[1]);
      if (amount) {
        const type = detectReserveType(trimmed);
        return {
          intent: "add_reserve",
          data: { amount, type },
          preview: `${type === "deposit" ? "Depositar" : "Retirar"} R$ ${amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} ${type === "deposit" ? "na" : "da"} reserva`,
          confidence: "high",
        };
      }
    }
  }

  // --- add_investment ---
  for (const pattern of INVESTMENT_PATTERNS) {
    const match = trimmed.match(pattern);
    if (match) {
      const amount = parseAmount(match[1]);
      const category = match[2]?.trim();
      if (amount && category) {
        return {
          intent: "add_investment",
          data: { value: amount, category },
          preview: `Registrar investimento de R$ ${amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} em "${category}"`,
          confidence: "high",
        };
      }
    }
  }

  // --- query_investments ---
  for (const pattern of QUERY_INVESTMENTS_PATTERNS) {
    if (pattern.test(trimmed)) {
      return {
        intent: "query_investments",
        data: {},
        preview: "Consultar seus investimentos",
        confidence: "high",
      };
    }
  }

  // --- query_finances ---
  for (const pattern of QUERY_FINANCES_PATTERNS) {
    if (pattern.test(trimmed)) {
      return {
        intent: "query_finances",
        data: {},
        preview: "Consultar suas finanças",
        confidence: "high",
      };
    }
  }

  // --- create_transaction (fallback to natural-transaction-parser) ---
  const parsed = parseTransaction(trimmed, categories);
  if (parsed.type !== "ambiguous" || parsed.amount !== null) {
    return {
      intent: "create_transaction",
      data: {
        type: parsed.type === "ambiguous" ? "expense" : parsed.type,
        amount: parsed.amount,
        date: parsed.date,
        category_id: parsed.category_id,
        description: parsed.description,
        warnings: parsed.warnings,
        _parsed: parsed,
      },
      preview: parsed.amount
        ? `${parsed.type === "income" ? "Receita" : "Despesa"} de R$ ${parsed.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
        : "Transação detectada (valor não identificado)",
      confidence: parsed.confidence,
    };
  }

  // --- query_general ---
  if (/\?|como|qual|quanto|quem|onde|quando|me mostre|me diz|explica/i.test(trimmed)) {
    return {
      intent: "query_general",
      data: { question: trimmed },
      preview: "Consulta geral",
      confidence: "low",
    };
  }

  return {
    intent: "unknown",
    data: {},
    preview: "Não entendi o comando",
    confidence: "low",
  };
}
