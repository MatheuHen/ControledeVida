import type { FinancialSummary } from "@/hooks/useFinancialSummary";
import type { FinancialTransaction } from "@/services/transactions.service";
import type { Category } from "@/services/categories.service";
import type { Profile } from "@/services/auth.service";

export type InsightType = "positive" | "warning" | "negative" | "neutral";

export interface Insight {
  type: InsightType;
  title: string;
  description: string;
  icon: string;
}

const PRIORITY: Record<InsightType, number> = {
  negative: 0,
  warning: 1,
  neutral: 2,
  positive: 3,
};

function sortInsights(insights: Insight[]): Insight[] {
  return insights.sort((a, b) => PRIORITY[a.type] - PRIORITY[b.type]);
}

export function generateInsights(
  summary: FinancialSummary,
  transactions: FinancialTransaction[],
  categories: Category[],
  profile: Profile | null | undefined,
): Insight[] {
  const insights: Insight[] = [];
  const { totalIncome, totalExpenses, balance } = summary;

  // Gasto > receita
  if (totalExpenses > totalIncome && totalIncome > 0) {
    insights.push({
      type: "negative",
      title: "Gastos maiores que receitas",
      description: `Você gastou ${((totalExpenses / totalIncome) * 100 - 100).toFixed(0)}% a mais do que recebeu neste período.`,
      icon: "TrendingDown",
    });
  }

  // Equilíbrio (economia ~0)
  if (totalIncome > 0 && Math.abs(balance) < totalIncome * 0.05) {
    insights.push({
      type: "neutral",
      title: "Equilíbrio financeiro",
      description: "Suas receitas e despesas estão praticamente empatadas. Considere aumentar sua taxa de economia.",
      icon: "Scale",
    });
  }

  // Taxa de economia positiva
  if (totalIncome > 0 && balance > totalIncome * 0.2) {
    insights.push({
      type: "positive",
      title: "Boa taxa de economia",
      description: `Você economizou ${((balance / totalIncome) * 100).toFixed(0)}% da sua renda neste período. Excelente!`,
      icon: "PiggyBank",
    });
  }

  // Concentração >=50% em categoria
  const expensesByCategory: Record<string, number> = {};
  for (const t of transactions) {
    if (t.type === "expense" && t.status !== "cancelled" && t.category_id) {
      expensesByCategory[t.category_id] =
        (expensesByCategory[t.category_id] ?? 0) + t.amount;
    }
  }

  for (const [catId, amount] of Object.entries(expensesByCategory)) {
    if (totalExpenses > 0 && amount / totalExpenses >= 0.5) {
      const cat = categories.find((c) => c.id === catId);
      insights.push({
        type: "warning",
        title: "Concentração de gastos",
        description: `${(amount / totalExpenses * 100).toFixed(0)}% dos seus gastos estão em "${cat?.name ?? "uma categoria"}". Avalie se faz sentido.`,
        icon: "AlertCircle",
      });
    }
  }

  // Horas de vida >=8h
  if (profile?.hourly_rate && profile.hourly_rate > 0 && totalExpenses > 0) {
    const hoursSpent = totalExpenses / profile.hourly_rate;
    if (hoursSpent >= 8) {
      insights.push({
        type: "neutral",
        title: "Horas de vida gastas",
        description: `Você trabalhou ${hoursSpent.toFixed(0)} horas para pagar suas despesas neste período.`,
        icon: "Clock",
      });
    }
  }

  // Sem receitas registradas
  if (totalIncome === 0 && totalExpenses > 0) {
    insights.push({
      type: "warning",
      title: "Nenhuma receita registrada",
      description: "Você tem despesas mas não registrou receitas. Adicione suas entradas para ter uma visão completa.",
      icon: "AlertTriangle",
    });
  }

  // Sem dados
  if (totalIncome === 0 && totalExpenses === 0) {
    insights.push({
      type: "neutral",
      title: "Sem movimentações",
      description: "Nenhuma transação encontrada neste período. Comece registrando suas receitas e despesas.",
      icon: "Info",
    });
  }

  return sortInsights(insights).slice(0, 3);
}
