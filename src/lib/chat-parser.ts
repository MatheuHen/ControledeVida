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
  | "query_life_cost"
  | "query_spending"
  | "query_general"
  | "unknown";

export interface ParsedCommand {
  intent: ChatIntent;
  data: Record<string, unknown>;
  preview: string;
  confidence: "high" | "low";
}

// ─── Typo normalization ───────────────────────────────────────────────────────
const TYPO_MAP: Record<string, string> = {
  genhei: "ganhei",
  gnhei: "ganhei",
  gnehei: "ganhei",
  recbi: "recebi",
  recevi: "recebi",
  recebei: "recebi",
  gasstei: "gastei",
  gastei: "gastei",
  paagei: "paguei",
  investiment: "investimento",
  investmento: "investimento",
  ivestimento: "investimento",
  invistimento: "investimento",
  reseva: "reserva",
  reserba: "reserva",
};

function normalizeTypos(text: string): string {
  return text
    .split(/\b/)
    .map((word) => TYPO_MAP[word.toLowerCase()] ?? word)
    .join("");
}

// ─── Keyword sets ─────────────────────────────────────────────────────────────
const QUERY_KEYWORDS = [
  "quantas", "quanto", "qual", "quais", "como", "onde", "quando",
  "por que", "porque", "me mostra", "me diz", "me fala", "posso",
  "será", "sera", "me conta", "explica", "explique", "mostre",
  "está", "estão", "fica", "ficam",
  "relatorio", "relatório", "resumo",
];

const LIFE_COST_KEYWORDS = ["hora", "horas", "vida", "custar", "custaria", "vale", "equivale"];

const SPENDING_QUERY_KEYWORDS = [
  "estou gastando", "gastando mais", "gastei mais",
  "maior gasto", "maiores gastos",
];

const INVESTMENT_KEYWORDS = [
  "invest", // prefix match covers: investimento, investi, investir, investirei
  "apliquei", "aplicar", "aplicação", "aplicacao",
  "ação", "ações", "acao", "acoes",
  "renda fixa", "rendafixa",
  "fundo", "fii",
  "cripto", "bitcoin", "btc", "ethereum", "eth",
  "cdb", "tesouro", "lci", "lca", "debenture", "debênture",
  "bolsa", "b3",
];

const RESERVE_KEYWORDS = [
  "reserva",
  "guardar", "guardei", "guardar",
  "emergência", "emergencia",
  "poupança", "poupanca",
];

const CATEGORY_KEYWORDS_ACTION = [
  "cria categoria", "criar categoria", "nova categoria", "adiciona categoria",
  "adicionar categoria",
];

const GOAL_KEYWORDS = [
  "meta de", "criar meta", "nova meta",
  "quero juntar", "preciso juntar", "quero poupar", "preciso poupar",
  "quero economizar", "preciso economizar",
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseAmount(raw: string): number | null {
  const cleaned = raw.replace(/\./g, "").replace(",", ".");
  const value = parseFloat(cleaned);
  return isNaN(value) || value <= 0 ? null : value;
}

function extractFirstAmount(text: string): number | null {
  const patterns = [
    /R\$\s*([\d.]+,\d{2})/,
    /R\$\s*(\d+)/,
    /([\d.]+,\d{2})\b/,
    /(\d{1,3}(?:\.\d{3})+)\b/,
    /\b(\d+(?:[.,]\d+)?)\b/,
  ];
  for (const pat of patterns) {
    const m = text.match(pat);
    if (m) {
      const val = parseAmount(m[1]);
      if (val !== null) return val;
    }
  }
  return null;
}

function detectReserveType(text: string): "deposit" | "withdrawal" {
  if (/retirar?|sacar?|resgate|retirei|saquei/i.test(text)) return "withdrawal";
  return "deposit";
}

/** Returns true if the text contains a question/query intent */
function isQuery(lower: string): boolean {
  return QUERY_KEYWORDS.some((kw) => lower.includes(kw));
}

/** Returns true if text contains investment-related keywords */
function hasInvestmentKeyword(lower: string): boolean {
  return INVESTMENT_KEYWORDS.some((kw) => lower.includes(kw));
}

/** Returns true if text contains reserve-related keywords */
function hasReserveKeyword(lower: string): boolean {
  return RESERVE_KEYWORDS.some((kw) => lower.includes(kw));
}

// ─── Date extraction (local-aware) ───────────────────────────────────────────
function extractDateLocal(text: string): string {
  const lower = text.toLowerCase();
  const today = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const fmt = (d: Date) =>
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  if (lower.includes("hoje")) return fmt(today);
  if (lower.includes("ontem")) {
    const d = new Date(today);
    d.setDate(d.getDate() - 1);
    return fmt(d);
  }
  if (lower.includes("amanhã") || lower.includes("amanha")) {
    const d = new Date(today);
    d.setDate(d.getDate() + 1);
    return fmt(d);
  }

  const diaMatch = text.match(/\bdia\s+(\d{1,2})\b/i);
  if (diaMatch) {
    const day = parseInt(diaMatch[1], 10);
    const d = new Date(today.getFullYear(), today.getMonth(), day);
    if (!isNaN(d.getTime())) return fmt(d);
  }

  const brDate = text.match(/\b(\d{2})\/(\d{2})\/(\d{4})\b/);
  if (brDate) {
    const d = new Date(
      parseInt(brDate[3]),
      parseInt(brDate[2]) - 1,
      parseInt(brDate[1]),
    );
    if (!isNaN(d.getTime())) return fmt(d);
  }

  return fmt(today);
}

// ─── Main parser ──────────────────────────────────────────────────────────────

export function parseCommand(text: string, categories: Category[]): ParsedCommand {
  const normalized = normalizeTypos(text.trim());
  const lower = normalized.toLowerCase();

  // ── 1. QUERY detection (MUST come first — never create a record for questions) ──
  if (isQuery(lower)) {
    // a) Life-cost query: "quantas horas de vida custa um item de R$ 100"
    if (
      LIFE_COST_KEYWORDS.some((k) => lower.includes(k)) &&
      (lower.includes("quantas") || lower.includes("quanto") || lower.includes("custar") || lower.includes("custaria") || lower.includes("vale"))
    ) {
      const value = extractFirstAmount(normalized);
      return {
        intent: "query_life_cost",
        data: { value },
        preview: value
          ? `Calcular custo em horas de vida para R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
          : "Calcular custo em horas de vida",
        confidence: "high",
      };
    }

    // b) Spending query: "onde estou gastando mais", "quanto gastei em X"
    if (SPENDING_QUERY_KEYWORDS.some((k) => lower.includes(k))) {
      return {
        intent: "query_spending",
        data: {},
        preview: "Analisar seus gastos",
        confidence: "high",
      };
    }

    // c) Investment query
    if (hasInvestmentKeyword(lower) || lower.includes("carteira") || lower.includes("rendimento")) {
      return {
        intent: "query_investments",
        data: {},
        preview: "Consultar seus investimentos",
        confidence: "high",
      };
    }

    // d) Finances query: "quanto gastei", "qual meu saldo", etc.
    if (
      /quanto\s+gast|quanto\s+receb|qual\s+(é|foi)\s+meu\s+saldo|meu\s+saldo|resumo|finanças|gastos|despesas|receitas/.test(lower)
    ) {
      return {
        intent: "query_finances",
        data: {},
        preview: "Consultar suas finanças",
        confidence: "high",
      };
    }

    // e) Generic query
    return {
      intent: "query_general",
      data: { question: normalized },
      preview: "Consulta geral",
      confidence: "low",
    };
  }

  // ── 2. INVESTMENT ──────────────────────────────────────────────────────────
  if (hasInvestmentKeyword(lower)) {
    const amount = extractFirstAmount(normalized);
    if (amount) {
      // Try to extract category from text: "em <category>"
      const emMatch = normalized.match(/\bem\s+(.+?)(?:\s+hoje|\s+ontem|\s+amanhã|\s+dia\s|\s+R\$|\s*$)/i);
      const category = emMatch?.[1]?.trim() || "Investimento";
      const date = extractDateLocal(normalized);
      return {
        intent: "add_investment",
        data: { value: amount, category, date },
        preview: `Novo Investimento: R$ ${amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} em ${category} em ${date.split("-").reverse().join("/")}`,
        confidence: "high",
      };
    }
  }

  // ── 3. RESERVE ────────────────────────────────────────────────────────────
  if (hasReserveKeyword(lower)) {
    const amount = extractFirstAmount(normalized);
    if (amount) {
      const type = detectReserveType(lower);
      const date = extractDateLocal(normalized);
      return {
        intent: "add_reserve",
        data: { amount, type, date },
        preview: `${type === "deposit" ? "Depósito na Reserva" : "Retirada da Reserva"}: R$ ${amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} em ${date.split("-").reverse().join("/")}`,
        confidence: "high",
      };
    }
  }

  // ── 4. GOAL ───────────────────────────────────────────────────────────────
  if (GOAL_KEYWORDS.some((k) => lower.includes(k))) {
    const amountMatch = normalized.match(/R?\$?\s*([\d.,]+)/);
    if (amountMatch) {
      const amount = parseAmount(amountMatch[1]);
      if (amount) {
        const nameMatch = normalized.match(/(?:meta|objetivo|poupar|juntar|economizar)\s+(?:de\s+)?R?\$?[\d.,]+\s+(?:para|pra)?\s*(.+)?/i);
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

  // ── 5. CATEGORY ──────────────────────────────────────────────────────────
  if (CATEGORY_KEYWORDS_ACTION.some((k) => lower.includes(k))) {
    const patterns = [
      /cria(?:r)?\s+categoria\s+(.+)/i,
      /nova\s+categoria\s+(.+)/i,
      /adiciona(?:r)?\s+categoria\s+(.+)/i,
    ];
    for (const pattern of patterns) {
      const match = normalized.match(pattern);
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
  }

  // ── 6. TRANSACTION (fallback) ─────────────────────────────────────────────
  const parsed = parseTransaction(normalized, categories);
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

  return {
    intent: "unknown",
    data: {},
    preview: "Não entendi o comando",
    confidence: "low",
  };
}
