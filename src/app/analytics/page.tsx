'use client'

import { useState } from "react"
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns"
import { ptBR } from "date-fns/locale"

import { useActiveUser } from "@/hooks/useActiveUser"
import { useTransactions } from "@/hooks/useTransactions"
import { useCategories } from "@/hooks/useCategories"
import { useFinancialSummary } from "@/hooks/useFinancialSummary"

import { FinancialEvolutionChart } from "@/components/charts/FinancialEvolutionChart"
import { ExpensesByCategoryChart } from "@/components/charts/ExpensesByCategoryChart"
import { MonthlyBalanceChart } from "@/components/charts/MonthlyBalanceChart"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import { cn, formatCurrency, formatDate } from "@/lib/utils"
import { getDateRange, type PeriodPreset } from "@/lib/period"

const periodPresets: { label: string; value: Exclude<PeriodPreset, "custom"> }[] = [
  { label: "Hoje", value: "today" },
  { label: "7d", value: "7d" },
  { label: "30d", value: "30d" },
  { label: "Mês", value: "month" },
  { label: "Ano", value: "year" },
]

export default function AnalyticsPage() {
  const { activeUserId } = useActiveUser()
  const userId = activeUserId ?? ""

  const [period, setPeriod] = useState<Exclude<PeriodPreset, "custom">>("month")

  const dateRange = getDateRange(period)
  const dateFrom = format(dateRange.from, "yyyy-MM-dd")
  const dateTo = format(dateRange.to, "yyyy-MM-dd")

  const { data: transactions, isLoading: txLoading } = useTransactions(userId, { dateFrom, dateTo })
  const { data: categories } = useCategories(userId)
  const { data: summary, isLoading: summaryLoading } = useFinancialSummary(userId, dateFrom, dateTo)

  // Metrics
  const incomeTransactions = (transactions ?? []).filter((t) => t.type === "income" && t.status !== "cancelled")
  const expenseTransactions = (transactions ?? []).filter((t) => t.type === "expense" && t.status !== "cancelled")

  const maxIncome = incomeTransactions.length > 0
    ? incomeTransactions.reduce((max, t) => t.amount > max.amount ? t : max, incomeTransactions[0])
    : null

  const maxExpense = expenseTransactions.length > 0
    ? expenseTransactions.reduce((max, t) => t.amount > max.amount ? t : max, expenseTransactions[0])
    : null

  // Days with expenses
  const daysWithExpenses = new Set(expenseTransactions.map((t) => t.due_date)).size

  // Average daily expenses
  const periodDays = Math.max(
    1,
    Math.round((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24)) + 1
  )
  const avgDailyExpense = (summary?.totalExpenses ?? 0) / periodDays

  // Evolution data
  const evolutionData = (() => {
    if (!transactions) return []
    const sorted = [...transactions]
      .filter((t) => t.status !== "cancelled")
      .sort((a, b) => a.due_date.localeCompare(b.due_date))
    let running = 0
    const byDate: Record<string, number> = {}
    for (const t of sorted) {
      running += t.type === "income" ? t.amount : -t.amount
      byDate[t.due_date] = running
    }
    return Object.entries(byDate).map(([date, saldo]) => ({ date: formatDate(date), saldo }))
  })()

  // Expenses by category
  const expensesByCategory = (() => {
    const grouped: Record<string, number> = {}
    for (const t of expenseTransactions) {
      const catId = t.category_id ?? "__none__"
      grouped[catId] = (grouped[catId] ?? 0) + t.amount
    }
    return Object.entries(grouped).map(([catId, value]) => {
      const name = catId === "__none__"
        ? "Sem categoria"
        : (categories?.find((c) => c.id === catId)?.name ?? catId)
      return { name, value }
    }).sort((a, b) => b.value - a.value)
  })()

  // Monthly data (last 6 months)
  const monthlyData = (() => {
    const now = new Date()
    const allTx = transactions ?? []
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = subMonths(now, 5 - i)
      return {
        label: format(d, "MMM/yy", { locale: ptBR }),
        from: format(startOfMonth(d), "yyyy-MM-dd"),
        to: format(endOfMonth(d), "yyyy-MM-dd"),
      }
    })
    return months.map(({ label, from, to }) => {
      const monthTxs = allTx.filter((t) => t.due_date >= from && t.due_date <= to && t.status !== "cancelled")
      const income = monthTxs.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0)
      const expense = monthTxs.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0)
      return { label, saldo: income - expense }
    })
  })()

  // Top 5 biggest expenses
  const top5Expenses = [...expenseTransactions]
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5)

  return (
    <div className="space-y-6">
      <div className="space-y-6">
        {/* Header + Period */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
            <p className="mt-1 text-sm text-muted-foreground">Análise detalhada das suas finanças</p>
          </div>
          <div className="flex gap-1">
            {periodPresets.map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                  period === p.value
                    ? "bg-emerald-500 text-emerald-950"
                    : "text-zinc-400 hover:bg-white/10 hover:text-zinc-200"
                )}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Metric Cards */}
        <div className="grid gap-4 sm:grid-cols-4">
          <MetricCard
            label="Maior receita"
            isLoading={txLoading}
            value={maxIncome ? formatCurrency(maxIncome.amount) : "—"}
            sub={maxIncome?.description}
            valueClass="text-emerald-400"
          />
          <MetricCard
            label="Maior despesa"
            isLoading={txLoading}
            value={maxExpense ? formatCurrency(maxExpense.amount) : "—"}
            sub={maxExpense?.description}
            valueClass="text-red-400"
          />
          <MetricCard
            label="Média diária de gastos"
            isLoading={summaryLoading}
            value={formatCurrency(avgDailyExpense)}
            sub={`${periodDays} dias no período`}
            valueClass="text-orange-400"
          />
          <MetricCard
            label="Dias com gastos"
            isLoading={txLoading}
            value={String(daysWithExpenses)}
            sub={`de ${periodDays} dias`}
            valueClass="text-zinc-100"
          />
        </div>

        {/* Charts Tabs */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-5">
          <Tabs defaultValue="evolucao">
            <TabsList className="mb-4 bg-white/5">
              <TabsTrigger value="evolucao">Evolução</TabsTrigger>
              <TabsTrigger value="categorias">Categorias</TabsTrigger>
              <TabsTrigger value="mensal">Mensal</TabsTrigger>
            </TabsList>

            <TabsContent value="evolucao">
              {txLoading ? (
                <Skeleton className="h-64 w-full rounded-xl" />
              ) : (
                <FinancialEvolutionChart data={evolutionData} />
              )}
            </TabsContent>

            <TabsContent value="categorias">
              {txLoading ? (
                <Skeleton className="h-64 w-full rounded-xl" />
              ) : (
                <ExpensesByCategoryChart data={expensesByCategory} />
              )}
            </TabsContent>

            <TabsContent value="mensal">
              {txLoading ? (
                <Skeleton className="h-64 w-full rounded-xl" />
              ) : (
                <MonthlyBalanceChart data={monthlyData} />
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Top 5 Expenses */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-5">
          <h2 className="mb-4 text-sm font-medium text-zinc-300">Top 5 maiores gastos</h2>
          {txLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-lg" />
              ))}
            </div>
          ) : top5Expenses.length === 0 ? (
            <p className="text-sm text-zinc-500">Nenhuma despesa no período.</p>
          ) : (
            <div className="space-y-2">
              {top5Expenses.map((t, idx) => {
                const catName = t.category_id
                  ? (categories?.find((c) => c.id === t.category_id)?.name ?? "—")
                  : "Sem categoria"
                const maxAmt = top5Expenses[0].amount
                const pct = maxAmt > 0 ? (t.amount / maxAmt) * 100 : 0
                return (
                  <div key={t.id} className="flex items-center gap-3 rounded-lg border border-white/10 bg-white/5 p-3">
                    <span className="w-5 shrink-0 text-center text-xs font-bold text-zinc-500">{idx + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-medium text-zinc-100">{t.description}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <div className="h-1.5 flex-1 rounded-full bg-white/10">
                          <div className="h-1.5 rounded-full bg-red-500/70" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-zinc-500">{catName}</span>
                      </div>
                    </div>
                    <span className="shrink-0 font-semibold text-red-400">{formatCurrency(t.amount)}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function MetricCard({
  label,
  value,
  sub,
  isLoading,
  valueClass,
}: {
  label: string
  value: string
  sub?: string
  isLoading?: boolean
  valueClass: string
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <p className="text-xs text-zinc-400">{label}</p>
      {isLoading ? (
        <Skeleton className="mt-2 h-7 w-24" />
      ) : (
        <p className={cn("mt-2 text-xl font-bold truncate", valueClass)}>{value}</p>
      )}
      {sub && !isLoading && (
        <p className="mt-0.5 truncate text-xs text-zinc-500">{sub}</p>
      )}
    </div>
  )
}
