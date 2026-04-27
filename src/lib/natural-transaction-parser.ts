import type { Category } from "@/services/categories.service";
import { format, parse, isValid, addDays } from "date-fns";

type ParsedTransactionType = "income" | "expense" | "ambiguous";
type ParseConfidence = "high" | "low";

export interface ParsedTransaction {
  type: ParsedTransactionType;
  amount: number | null;
  date: string | null;
  category_id: string | null;
  description: string;
  confidence: ParseConfidence;
  warnings: string[];
}

const INCOME_KEYWORDS = [
  "recebi", "ganhei", "entrou", "salário", "salario", "renda",
  "pagamento recebido", "transferência recebida", "transferencia recebida",
  "depósito", "deposito", "freelance",
];
const EXPENSE_KEYWORDS = [
  "gastei", "paguei", "comprei", "saiu", "despesa", "gasto",
  "conta", "fatura", "boleto", "compra", "pago", "custo",
];

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  Alimentação: ["comida", "almoço", "almoco", "jantar", "lanche", "café", "cafe", "restaurante", "supermercado", "mercado", "ifood", "delivery"],
  Transporte: ["uber", "ônibus", "onibus", "metrô", "metro", "gasolina", "combustível", "combustivel", "táxi", "taxi", "passagem", "transporte"],
  Saúde: ["farmácia", "farmacia", "remédio", "remedio", "médico", "medico", "hospital", "plano de saúde", "consulta"],
  Moradia: ["aluguel", "condomínio", "condominio", "água", "agua", "luz", "energia", "internet", "iptu"],
  Lazer: ["cinema", "streaming", "netflix", "spotify", "show", "viagem", "hotel", "passeio", "academia"],
  Educação: ["curso", "livro", "escola", "faculdade", "mensalidade", "educação"],
  Roupas: ["roupa", "sapato", "calçado", "calcado", "vestuário", "vestuario", "loja"],
  Tecnologia: ["celular", "computador", "notebook", "software", "app", "assinatura"],
};

function detectType(text: string): ParsedTransactionType {
  const lower = text.toLowerCase();
  const hasIncome = INCOME_KEYWORDS.some((k) => lower.includes(k));
  const hasExpense = EXPENSE_KEYWORDS.some((k) => lower.includes(k));
  if (hasIncome && !hasExpense) return "income";
  if (hasExpense && !hasIncome) return "expense";
  if (hasIncome && hasExpense) return "ambiguous";
  return "ambiguous";
}

function extractAmount(text: string): number | null {
  // Rejeitar frações como 1/2
  const fractionPattern = /\b\d+\/\d+\b/;
  if (fractionPattern.test(text)) return null;

  // Tentar padrões: R$ 1.500,00 | 1500,00 | 1500.00 | 1500
  const patterns = [
    /R\$\s*([\d.]+,\d{2})/,
    /R\$\s*(\d+)/,
    /([\d.]+,\d{2})\b/,
    /(\d{1,3}(?:\.\d{3})+)\b/,
    /\b(\d+)\b/,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      let raw = match[1];
      // Normalizar para float
      // Formato pt-BR: 1.500,00 → 1500.00
      if (raw.includes(",") && raw.includes(".")) {
        raw = raw.replace(/\./g, "").replace(",", ".");
      } else if (raw.includes(",")) {
        raw = raw.replace(",", ".");
      } else if (raw.includes(".") && /\d{3}$/.test(raw)) {
        // Poderia ser separador de milhar
        raw = raw.replace(/\./g, "");
      }
      const value = parseFloat(raw);
      if (value > 0) return value;
    }
  }
  return null;
}

function extractDate(text: string): string | null {
  const lower = text.toLowerCase();
  const today = new Date();

  if (lower.includes("hoje")) {
    return format(today, "yyyy-MM-dd");
  }
  if (lower.includes("ontem")) {
    return format(addDays(today, -1), "yyyy-MM-dd");
  }
  if (lower.includes("amanhã") || lower.includes("amanha")) {
    return format(addDays(today, 1), "yyyy-MM-dd");
  }

  // dia 15
  const diaMatch = text.match(/\bdia\s+(\d{1,2})\b/i);
  if (diaMatch) {
    const day = parseInt(diaMatch[1], 10);
    const d = new Date(today.getFullYear(), today.getMonth(), day);
    if (isValid(d)) return format(d, "yyyy-MM-dd");
  }

  // DD/MM/YYYY
  const brDateMatch = text.match(/\b(\d{2})\/(\d{2})\/(\d{4})\b/);
  if (brDateMatch) {
    const d = parse(`${brDateMatch[1]}/${brDateMatch[2]}/${brDateMatch[3]}`, "dd/MM/yyyy", new Date());
    if (isValid(d)) return format(d, "yyyy-MM-dd");
  }

  // YYYY-MM-DD
  const isoMatch = text.match(/\b(\d{4}-\d{2}-\d{2})\b/);
  if (isoMatch) {
    const d = new Date(isoMatch[1]);
    if (isValid(d)) return isoMatch[1];
  }

  return format(today, "yyyy-MM-dd");
}

function suggestCategory(text: string, categories: Category[]): string | null {
  const lower = text.toLowerCase();

  // Match by user's category names first
  for (const cat of categories) {
    if (lower.includes(cat.name.toLowerCase())) return cat.id;
  }

  // Match by keywords
  for (const [catName, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((k) => lower.includes(k))) {
      const match = categories.find(
        (c) => c.name.toLowerCase() === catName.toLowerCase(),
      );
      if (match) return match.id;
    }
  }

  return null;
}

export function parseTransaction(
  text: string,
  categories: Category[],
): ParsedTransaction {
  const warnings: string[] = [];
  const type = detectType(text);
  const amount = extractAmount(text);
  const date = extractDate(text);
  const category_id = suggestCategory(text, categories);

  if (amount === null) warnings.push("Valor não identificado");
  if (type === "ambiguous") warnings.push("Tipo (receita/despesa) ambíguo");
  if (!category_id) warnings.push("Categoria não identificada");

  const confidence: ParseConfidence =
    type !== "ambiguous" && amount !== null && category_id !== null
      ? "high"
      : "low";

  return {
    type,
    amount,
    date,
    category_id,
    description: text.trim(),
    confidence,
    warnings,
  };
}
