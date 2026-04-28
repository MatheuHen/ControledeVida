"use client";

import { useMemo } from "react";
import { format as dateFnsFormat } from "date-fns";
import {
  TrendingUp,
  TrendingDown,
  PiggyBank,
  DollarSign,
  Clock,
  Shield,
  BarChart2,
  AlertTriangle,
  CheckCircle2,
  Info,
  Minus,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useActiveUser } from "@/hooks/useActiveUser";
import { useTransactions } from "@/hooks/useTransactions";
import { useFinancialSummary } from "@/hooks/useFinancialSummary";
import { useGoals } from "@/hooks/useGoals";
import { useReserveEntries } from "@/hooks/useReserveEntries";
import { useInvestmentEntries } from "@/hooks/useInvestmentEntries";
import { useProfile } from "@/hooks/useProfile";
import { useCategories } from "@/hooks/useCategories";
import { getDateRange } from "@/lib/period";
import { formatCurrency, cn } from "@/lib/utils";
import { getInsights } from "@/agents/agent-orchestrator";
import type { AgentInsight } from "@/agents/agent-types";

const INSIGHT_ICONS: Record<string, React.ElementType> = {
  positive: CheckCircle2,
  warning: AlertTriangle,
  negative: TrendingDown,
  neutral: Info,
};

const INSIGHT_COLORS: Record<string, string> = {
  positive: "text-emerald-400",
  warning: "text-yellow-400",
  negative: "text-red-400",
  neutral: "text-zinc-400",
};

const INSIGHT_BG: Record<string, string> = {
  positive: "border-emerald-500/20 bg-emerald-500/5",
  warning: "border-yellow-500/20 bg-yellow-500/5",
  negative: "border-red-500/20 bg-red-500/5",
  neutral: "border-white/5 bg-white/5",
};

const PIE_COLORS = ["#10b981", "#6366f1", "#f59e0b", "#3b82f6"];

function StatCard({
  title,
  value,
  sub,
  icon: Icon,
  color,
  isLoading,
}: {
  title: string;
  value: string;
  sub?: string;
  icon: React.ElementType;
  color: string;
  isLoading: boolean;
}) {
  return (
    <Card className="border-white/10 bg-white/5">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-400">{title}</p>
            {isLoading ? (
              <Skeleton className="mt-2 h-7 w-32" />
            ) : (
              <p className={cn("mt-1 text-2xl font-bold truncate", color)}>{value}</p>
            )}
            {sub && !isLoading && (
              <p className="mt-0.5 text-xs text-zinc-500">{sub}</p>
            )}
          </div>
          <Icon className={cn("ml-3 mt-0.5 h-5 w-5 shrink-0", color)} />
        </div>
      </CardContent>
    </Card>
  );
}

function InsightItem({ insight }: { insight: AgentInsight }) {
  const Icon = INSIGHT_ICONS[insight.type] ?? Info;
  return (
    <div
      className={cn(
        "flex gap-3 rounded-xl border p-4",
        INSIGHT_BG[insight.type],
      )}
    >
      <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", INSIGHT_COLORS[insight.type])} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-zinc-200">{insight.title}</p>
        <p className="mt-0.5 text-xs text-zinc-400">{insight.message}</p>
        {insight.actionLabel && insight.actionHref && (
          <a
            href={insight.actionHref}
            className="mt-2 inline-block text-xs font-medium text-emerald-400 hover:underline"
          >
            {insight.actionLabel} →
          </a>
        )}
      </div>
    </div>
  );
}

export default function GlobalPage() {
  const { activeUserId } = useActiveUser();
  const userId = activeUserId ?? "";

  const range = getDateRange("month");
  const dateFrom = dateFnsFormat(range.from, "yyyy-MM-dd");
  const dateTo = dateFnsFormat(range.to, "yyyy-MM-dd");

  const { data: profile } = useProfile();
  const { data: summary, isLoading: isSummaryLoading } = useFinancialSummary(userId, dateFrom, dateTo);
  const { data: transactions = [], isLoading: isTxLoading } = useTransactions(userId, { dateFrom, dateTo });
  const { data: allTransactions = [] } = useTransactions(userId);
  const { data: goals = [] } = useGoals(userId);
  const { data: reserveEntries = [] } = useReserveEntries(userId);
  const { data: investmentEntries = [] } = useInvestmentEntries(userId);
  const { data: categories = [] } = useCategories(userId);

  const isLoading = isSummaryLoading || isTxLoading;

  // Calculations
  const totalReserve = useMemo(
    () =>
      reserveEntries.reduce(
        (sum, e) => sum + (e.type === "deposit" ? e.amount : -e.amount),
        0,
      ),
    [reserveEntries],
  );

  const totalInvested = useMemo(
    () => investmentEntries.reduce((s, e) => s + e.value, 0),
    [investmentEntries],
  );

  const totalCurrentInvestments = useMemo(
    () => investmentEntries.reduce((s, e) => s + (e.current_value ?? e.value), 0),
    [investmentEntries],
  );

  const investmentPL = totalCurrentInvestments - totalInvested;
  const investmentPLPct = totalInvested > 0 ? (investmentPL / totalInvested) * 100 : 0;

  const totalPatrimony = totalReserve + totalCurrentInvestments;

  const monthlyExpenses = summary?.totalExpenses ?? 0;
  const monthlyIncome = summary?.totalIncome ?? 0;
  const monthlyBalance = summary?.balance ?? 0;

  const daysOfProtection =
    monthlyExpenses > 0 ? Math.floor((totalReserve / monthlyExpenses) * 30) : null;

  const hoursConsumed =
    profile?.hourly_rate && profile.hourly_rate > 0 && monthlyExpenses > 0
      ? (monthlyExpenses / profile.hourly_rate).toFixed(1)
      : null;

  // Evolution chart data (last 12 months)
  const evolutionData = useMemo(() => {
    const sorted = [...allTransactions]
      .filter((t) => t.status !== "cancelled")
      .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());
    let balance = 0;
    return sorted.map((t) => {
      balance += t.type === "income" ? t.amount : -t.amount;
      return {
        date: dateFnsFormat(new Date(t.due_date), "MM/yy"),
        saldo: balance,
      };
    });
  }, [allTransactions]);

  // Distribution pie
  const pieData = useMemo(() => {
    const items = [
      { name: "Reserva", value: totalReserve },
      { name: "Investimentos", value: totalCurrentInvestments },
      { name: "Saldo do mês", value: Math.max(0, monthlyBalance) },
    ].filter((d) => d.value > 0);
    return items;
  }, [totalReserve, totalCurrentInvestments, monthlyBalance]);

  // Insights from agent orchestrator
  const insights = useMemo(() => {
    if (!userId) return [];
    return getInsights(
      {
        userId,
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
          totalIncome: monthlyIncome,
          totalExpenses: monthlyExpenses,
          balance: monthlyBalance,
        },
      },
      5,
    );
  }, [
    userId,
    transactions,
    categories,
    goals,
    reserveEntries,
    investmentEntries,
    profile,
    monthlyIncome,
    monthlyExpenses,
    monthlyBalance,
  ]);

  if (!userId) {
    return (
      <div className="flex h-64 items-center justify-center text-zinc-400">
        Carregando...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-zinc-100">Visão Global</h1>
        <p className="text-sm text-zinc-400">Resumo centralizado do seu patrimônio</p>
      </div>

      {/* Main Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          title="Patrimônio Total"
          value={formatCurrency(totalPatrimony)}
          sub="Reserva + Investimentos"
          icon={Shield}
          color="text-violet-400"
          isLoading={isLoading}
        />
        <StatCard
          title="Reserva de Emergência"
          value={formatCurrency(totalReserve)}
          sub={
            daysOfProtection !== null
              ? `${daysOfProtection} dias de proteção`
              : "Configure despesas mensais"
          }
          icon={PiggyBank}
          color="text-blue-400"
          isLoading={isLoading}
        />
        <StatCard
          title="Investimentos"
          value={formatCurrency(totalCurrentInvestments)}
          sub={
            totalInvested > 0
              ? `${investmentPL >= 0 ? "+" : ""}${formatCurrency(investmentPL)} (${investmentPLPct.toFixed(1)}%)`
              : "Nenhum investimento"
          }
          icon={BarChart2}
          color={investmentPL >= 0 ? "text-emerald-400" : "text-red-400"}
          isLoading={isLoading}
        />
        <StatCard
          title="Economia do Mês"
          value={formatCurrency(monthlyBalance)}
          sub={
            monthlyIncome > 0
              ? `${((monthlyBalance / monthlyIncome) * 100).toFixed(1)}% da renda`
              : undefined
          }
          icon={monthlyBalance >= 0 ? TrendingUp : TrendingDown}
          color={monthlyBalance >= 0 ? "text-emerald-400" : "text-red-400"}
          isLoading={isLoading}
        />
        <StatCard
          title="Receitas do Mês"
          value={formatCurrency(monthlyIncome)}
          icon={TrendingUp}
          color="text-emerald-400"
          isLoading={isLoading}
        />
        <StatCard
          title="Despesas do Mês"
          value={formatCurrency(monthlyExpenses)}
          sub={
            hoursConsumed !== null
              ? `${hoursConsumed} horas de vida`
              : undefined
          }
          icon={hoursConsumed !== null ? Clock : TrendingDown}
          color="text-red-400"
          isLoading={isLoading}
        />
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Patrimony Evolution */}
        <Card className="border-white/10 bg-white/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-300">
              Evolução do Patrimônio
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : evolutionData.length === 0 ? (
              <div className="flex h-64 items-center justify-center text-sm text-zinc-500">
                Sem dados suficientes
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={evolutionData} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: "#a1a1aa", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tickFormatter={(v: number) =>
                      v >= 1000 || v <= -1000
                        ? `R$${(v / 1000).toFixed(0)}k`
                        : `R$${v.toFixed(0)}`
                    }
                    tick={{ fill: "#a1a1aa", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#18181b",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "12px",
                    }}
                    formatter={(value) => [formatCurrency(value as number), "Saldo acumulado"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="saldo"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, fill: "#10b981" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Distribution Pie */}
        <Card className="border-white/10 bg-white/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-zinc-300">
              Distribuição do Patrimônio
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : pieData.length === 0 ? (
              <div className="flex h-64 items-center justify-center text-sm text-zinc-500">
                Sem dados para exibir
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="45%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={PIE_COLORS[index % PIE_COLORS.length]}
                        stroke="transparent"
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#18181b",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "12px",
                    }}
                    formatter={(value) => [formatCurrency(value as number)]}
                  />
                  <Legend
                    formatter={(value) => (
                      <span className="text-xs text-zinc-300">{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Agent Insights */}
      <Card className="border-white/10 bg-white/5">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-zinc-300">
            Insights Inteligentes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {insights.length === 0 ? (
            <p className="text-sm text-zinc-500">
              Nenhum insight disponível no momento.
            </p>
          ) : (
            insights.map((insight) => (
              <InsightItem key={insight.id} insight={insight} />
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
