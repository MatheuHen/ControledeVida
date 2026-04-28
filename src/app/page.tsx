"use client";

import { useState, useMemo } from "react";
import { format as dateFnsFormat } from "date-fns";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  PiggyBank,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Info,
  Send,
  Zap,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ExpensesByCategoryChart } from "@/components/charts/ExpensesByCategoryChart";
import { IncomeExpenseBarChart } from "@/components/charts/IncomeExpenseBarChart";
import { FinancialEvolutionChart } from "@/components/charts/FinancialEvolutionChart";
import { useActiveUser } from "@/hooks/useActiveUser";
import { useFinancialSummary } from "@/hooks/useFinancialSummary";
import { useTransactions } from "@/hooks/useTransactions";
import { useUpcomingTransactions } from "@/hooks/useUpcomingTransactions";
import { useCategories } from "@/hooks/useCategories";
import { useProfile } from "@/hooks/useProfile";
import { useGoals } from "@/hooks/useGoals";
import { useReserveEntries } from "@/hooks/useReserveEntries";
import { useInvestmentEntries } from "@/hooks/useInvestmentEntries";
import { getDateRange, type PeriodPreset } from "@/lib/period";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import { generateInsights } from "@/lib/financial-insights";
import { getInsights } from "@/agents/agent-orchestrator";
import type { AgentInsight } from "@/agents/agent-types";
import { parseTransaction } from "@/lib/natural-transaction-parser";

const PERIOD_OPTIONS: { label: string; value: Exclude<PeriodPreset, "custom"> }[] = [
  { label: "Hoje", value: "today" },
  { label: "7 dias", value: "7d" },
  { label: "30 dias", value: "30d" },
  { label: "Este mês", value: "month" },
  { label: "Este ano", value: "year" },
];

const INSIGHT_ICONS: Record<string, React.ElementType> = {
  positive: CheckCircle2,
  warning: AlertTriangle,
  negative: AlertCircle,
  neutral: Info,
};

const INSIGHT_COLORS: Record<string, string> = {
  positive: "text-emerald-400",
  warning: "text-yellow-400",
  negative: "text-red-400",
  neutral: "text-zinc-400",
};

function AgentInsightCard({ insight }: { insight: AgentInsight }) {
  const Icon = INSIGHT_ICONS[insight.type] ?? Info;
  return (
    <div className="flex gap-3 rounded-xl border border-white/5 bg-white/5 p-4">
      <div className={cn("mt-0.5 shrink-0", INSIGHT_COLORS[insight.type])}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-zinc-200">{insight.title}</p>
        <p className="mt-0.5 text-xs text-zinc-400">{insight.message}</p>
        {insight.actionLabel && insight.actionHref && (
          <a
            href={insight.actionHref}
            className="mt-1.5 inline-block text-xs font-medium text-emerald-400 hover:underline"
          >
            {insight.actionLabel} →
          </a>
        )}
      </div>
    </div>
  );
}

function SummaryCard({
  title,
  value,
  icon: Icon,
  color,
  isLoading,
}: {
  title: string;
  value: number;
  icon: React.ElementType;
  color: string;
  isLoading: boolean;
}) {
  return (
    <Card className="border-white/10 bg-white/5">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">{title}</p>
            {isLoading ? (
              <Skeleton className="mt-2 h-7 w-32" />
            ) : (
              <p className={cn("mt-1 text-2xl font-bold", color)}>{formatCurrency(value)}</p>
            )}
          </div>
          <Icon className={cn("h-5 w-5", color)} />
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const [period, setPeriod] = useState<Exclude<PeriodPreset, "custom">>("month");
  const [quickInput, setQuickInput] = useState("");
  const [quickParsed, setQuickParsed] = useState<ReturnType<typeof parseTransaction> | null>(null);

  const { activeUserId } = useActiveUser();
  const { data: profile } = useProfile();

  const range = getDateRange(period);
  const dateFrom = dateFnsFormat(range.from, "yyyy-MM-dd");
  const dateTo = dateFnsFormat(range.to, "yyyy-MM-dd");

  const { data: summary, isLoading: isSummaryLoading } = useFinancialSummary(
    activeUserId ?? "",
    dateFrom,
    dateTo,
  );
  const { data: transactions = [], isLoading: isTransactionsLoading } = useTransactions(
    activeUserId ?? "",
    { dateFrom, dateTo },
  );
  const { data: upcoming = [] } = useUpcomingTransactions(activeUserId ?? "");
  const { data: categories = [] } = useCategories(activeUserId ?? "");
  const { data: goals = [] } = useGoals(activeUserId ?? "");
  const { data: reserveEntries = [] } = useReserveEntries(activeUserId ?? "");
  const { data: investmentEntries = [] } = useInvestmentEntries(activeUserId ?? "");

  const totalIncome = summary?.totalIncome ?? 0;
  const totalExpenses = summary?.totalExpenses ?? 0;
  const balance = summary?.balance ?? 0;
  const savings = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? (savings / totalIncome) * 100 : 0;

  const expensesByCategoryData = useMemo(() => {
    const map: Record<string, number> = {};
    for (const t of transactions) {
      if (t.type === "expense" && t.status !== "cancelled") {
        const cat = categories.find((c) => c.id === t.category_id);
        const key = cat?.name ?? "Outros";
        map[key] = (map[key] ?? 0) + t.amount;
      }
    }
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [transactions, categories]);

  const incomeExpenseData = useMemo(() => {
    const map: Record<string, { receitas: number; despesas: number }> = {};
    for (const t of transactions) {
      if (t.status === "cancelled") continue;
      const label = dateFnsFormat(new Date(t.due_date), "dd/MM");
      if (!map[label]) map[label] = { receitas: 0, despesas: 0 };
      if (t.type === "income") map[label].receitas += t.amount;
      else map[label].despesas += t.amount;
    }
    return Object.entries(map)
      .map(([label, data]) => ({ label, ...data }))
      .slice(-12);
  }, [transactions]);

  const evolutionData = useMemo(() => {
    const sorted = [...transactions]
      .filter((t) => t.status !== "cancelled")
      .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());
    let runningBalance = 0;
    return sorted.map((t) => {
      runningBalance += t.type === "income" ? t.amount : -t.amount;
      return {
        date: dateFnsFormat(new Date(t.due_date), "dd/MM"),
        saldo: runningBalance,
      };
    });
  }, [transactions]);

  // Use agent-orchestrator; fallback to legacy generateInsights if empty
  const agentInsights = useMemo(() => {
    if (!summary || !activeUserId) return [];
    const insights = getInsights(
      {
        userId: activeUserId,
        viewingMode: "own",
        permissions: ["finances", "investments", "goals"],
        period: range,
        transactions,
        categories,
        goals,
        reserveEntries,
        investmentEntries,
        profile: profile ?? null,
        financialSummary: {
          totalIncome,
          totalExpenses,
          balance,
        },
      },
      5,
    );

    if (insights.length > 0) return insights;

    // Fallback: convert legacy insights to AgentInsight shape
    const legacy = generateInsights(summary, transactions, categories, profile ?? null);
    return legacy.map((l, i) => ({
      id: `legacy-${i}`,
      agent: "legacy",
      type: l.type,
      priority: i,
      title: l.title,
      message: l.description,
    })) satisfies AgentInsight[];
  }, [summary, activeUserId, transactions, categories, goals, reserveEntries, investmentEntries, profile, totalIncome, totalExpenses, balance]);

  function handleQuickParse() {
    if (!quickInput.trim()) return;
    const result = parseTransaction(quickInput, categories);
    setQuickParsed(result);
  }

  if (!activeUserId) {
    return (
      <div className="flex h-64 items-center justify-center text-zinc-400">
        Carregando...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex flex-wrap gap-2">
        {PERIOD_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setPeriod(opt.value)}
            className={cn(
              "rounded-xl px-4 py-2 text-sm font-medium transition-colors",
              period === opt.value
                ? "bg-emerald-500 text-white"
                : "bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-zinc-200",
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard title="Receitas" value={totalIncome} icon={TrendingUp} color="text-emerald-400" isLoading={isSummaryLoading} />
        <SummaryCard title="Despesas" value={totalExpenses} icon={TrendingDown} color="text-red-400" isLoading={isSummaryLoading} />
        <SummaryCard title="Saldo" value={balance} icon={DollarSign} color={balance >= 0 ? "text-emerald-400" : "text-red-400"} isLoading={isSummaryLoading} />
        <SummaryCard title="Economia" value={savings} icon={PiggyBank} color={savings >= 0 ? "text-blue-400" : "text-red-400"} isLoading={isSummaryLoading} />
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-white/10 bg-white/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-300">Despesas por Categoria</CardTitle>
          </CardHeader>
          <CardContent>
            {isTransactionsLoading ? <Skeleton className="h-64 w-full" /> : <ExpensesByCategoryChart data={expensesByCategoryData} />}
          </CardContent>
        </Card>
        <Card className="border-white/10 bg-white/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-300">Receitas vs Despesas</CardTitle>
          </CardHeader>
          <CardContent>
            {isTransactionsLoading ? <Skeleton className="h-64 w-full" /> : <IncomeExpenseBarChart data={incomeExpenseData} />}
          </CardContent>
        </Card>
      </div>

      {/* Evolution Chart */}
      <Card className="border-white/10 bg-white/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-zinc-300">Evolução Financeira</CardTitle>
        </CardHeader>
        <CardContent>
          {isTransactionsLoading ? <Skeleton className="h-64 w-full" /> : <FinancialEvolutionChart data={evolutionData} />}
        </CardContent>
      </Card>

      {/* Bottom Row */}
      <div className="grid gap-4 lg:grid-cols-3">
        {/* Upcoming */}
        <Card className="border-white/10 bg-white/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-300">Próximos Vencimentos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {upcoming.length === 0 ? (
              <p className="text-sm text-zinc-500">Nenhum vencimento próximo</p>
            ) : (
              upcoming.slice(0, 5).map((t) => {
                const cat = categories.find((c) => c.id === t.category_id);
                return (
                  <div key={t.id} className="flex items-center justify-between rounded-lg bg-white/5 p-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-zinc-200">{t.description}</p>
                      <p className="text-xs text-zinc-500">{formatDate(t.due_date)} · {cat?.name ?? "Sem categoria"}</p>
                    </div>
                    <span className={cn("ml-3 text-sm font-semibold", t.type === "income" ? "text-emerald-400" : "text-red-400")}>
                      {t.type === "expense" ? "-" : "+"}
                      {formatCurrency(t.amount)}
                    </span>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Quick Transaction */}
        <Card className="border-white/10 bg-white/5">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-zinc-300">
              <Zap className="h-4 w-4 text-emerald-400" />
              Lançamento Rápido
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-zinc-500">
              Ex: &quot;Gastei R$ 50 no mercado hoje&quot;
            </p>
            <div className="flex gap-2">
              <Input
                placeholder="Descreva o lançamento..."
                value={quickInput}
                onChange={(e) => setQuickInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleQuickParse()}
                className="flex-1"
              />
              <Button onClick={handleQuickParse} className="shrink-0 h-11 w-11 px-0">
                <Send className="h-4 w-4" />
              </Button>
            </div>
            {quickParsed && (
              <div className="space-y-1.5 rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="flex justify-between">
                  <span className="text-xs text-zinc-400">Tipo</span>
                  <Badge variant={quickParsed.type === "income" ? "success" : quickParsed.type === "expense" ? "destructive" : "secondary"}>
                    {quickParsed.type === "income" ? "Receita" : quickParsed.type === "expense" ? "Despesa" : "Ambíguo"}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-zinc-400">Valor</span>
                  <span className="text-sm text-zinc-200">{quickParsed.amount ? formatCurrency(quickParsed.amount) : "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-zinc-400">Data</span>
                  <span className="text-sm text-zinc-200">{quickParsed.date ?? "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-zinc-400">Confiança</span>
                  <Badge variant={quickParsed.confidence === "high" ? "success" : "warning"}>
                    {quickParsed.confidence === "high" ? "Alta" : "Baixa"}
                  </Badge>
                </div>
                {quickParsed.warnings.map((w, i) => (
                  <p key={i} className="text-xs text-yellow-400">⚠ {w}</p>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Insights - now using agent-orchestrator */}
        <Card className="border-white/10 bg-white/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-300">Insights</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {agentInsights.length === 0 ? (
              <p className="text-sm text-zinc-500">Nenhum insight disponível</p>
            ) : (
              agentInsights.map((insight) => (
                <AgentInsightCard key={insight.id} insight={insight} />
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Savings Rate Bar */}
      {totalIncome > 0 && (
        <Card className="border-white/10 bg-white/5">
          <CardContent className="flex items-center gap-4 p-5">
            <PiggyBank className="h-8 w-8 shrink-0 text-emerald-400" />
            <div className="flex-1">
              <p className="text-sm text-zinc-400">Taxa de economia do período</p>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className={cn("h-full rounded-full transition-all", savingsRate >= 20 ? "bg-emerald-500" : savingsRate >= 0 ? "bg-yellow-500" : "bg-red-500")}
                  style={{ width: `${Math.max(0, Math.min(100, savingsRate))}%` }}
                />
              </div>
            </div>
            <span className={cn("text-xl font-bold", savingsRate >= 0 ? "text-emerald-400" : "text-red-400")}>
              {savingsRate.toFixed(1)}%
            </span>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
