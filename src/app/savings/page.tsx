'use client'

import { useState } from "react"
import { format, subMonths, startOfMonth, endOfMonth } from "date-fns"
import { ptBR } from "date-fns/locale"

import { useActiveUser } from "@/hooks/useActiveUser"
import { useFinancialSummary } from "@/hooks/useFinancialSummary"
import { useTransactions } from "@/hooks/useTransactions"
import { useProfile } from "@/hooks/useProfile"

import { FinancialEvolutionChart } from "@/components/charts/FinancialEvolutionChart"
import { MonthlyBalanceChart } from "@/components/charts/MonthlyBalanceChart"

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

export default function SavingsPage() {
  const { activeUserId } = useActiveUser()
  const userId = activeUserId ?? ""

  const [period, setPeriod] = useState<Exclude<PeriodPreset, "custom">>("month")
  const { data: profile } = useProfile()

  const dateRange = getDateRange(period)
  const dateFrom = format(dateRange.from, "yyyy-MM-dd")
  const dateTo = format(dateRange.to, "yyyy-MM-dd")

  // Previous period
  const prevFrom = format(
    new Date(dateRange.from.getTime() - (dateRange.to.getTime() - dateRange.from.getTime())),
    "yyyy-MM-dd"
  )
  const prevTo = format(
    new Date(dateRange.from.getTime() - 1),
    "yyyy-MM-dd"
  )

  const { data: summary, isLoading: summaryLoading } = useFinancialSummary(userId, dateFrom, dateTo)
  const { data: prevSummary, isLoading: prevLoading } = useFinancialSummary(userId, prevFrom, prevTo)
  const { data: transactions, isLoading: txLoading } = useTransactions(userId, { dateFrom, dateTo })

  // Build evolution chart data (cumulative by day)
  const evolutionData = (() => {
    if (!transactions) return []
    const sorted = [...transactions]
      .filter((t) => t.status !== "cancelled")
      .sort((a, b) => a.due_date.localeCompare(b.due_date))

    let running = 0
    const byDate: Record<string, number> = {}
    for (const t of sorted) {
      const delta = t.type === "income" ? t.amount : -t.amount
      running += delta
      byDate[t.due_date] = running
    }

    return Object.entries(byDate).map(([date, saldo]) => ({
      date: formatDate(date),
      saldo,
    }))
  })()

  // Monthly breakdown: last 6 months
  const monthlyData = (() => {
    if (!transactions) return []
    const now = new Date()
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = subMonths(now, 5 - i)
      return {
        label: format(d, "MMM/yy", { locale: ptBR }),
        from: format(startOfMonth(d), "yyyy-MM-dd"),
        to: format(endOfMonth(d), "yyyy-MM-dd"),
      }
    })

    return months.map(({ label, from, to }) => {
      const monthTxs = (transactions ?? []).filter(
        (t) => t.due_date >= from && t.due_date <= to && t.status !== "cancelled"
      )
      const income = monthTxs.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0)
      const expense = monthTxs.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0)
      return { label, saldo: income - expense }
    })
  })()

  const savingsRate =
    summary && summary.totalIncome > 0
      ? ((summary.totalIncome - summary.totalExpenses) / summary.totalIncome) * 100
      : 0

  const hourlyRate = profile?.hourly_rate

  return (
    <div className="space-y-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Economia</h1>
            <p className="mt-1 text-sm text-muted-foreground">Análise das suas receitas e despesas</p>
          </div>

          {/* Period presets */}
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

        {/* Summary Cards */}
        <div className={cn("grid gap-4", hourlyRate ? "sm:grid-cols-5" : "sm:grid-cols-4")}>
          <SummaryCard
            label="Receitas totais"
            value={summary?.totalIncome}
            isLoading={summaryLoading}
            valueClass="text-emerald-400"
            prev={prevSummary?.totalIncome}
          />
          <SummaryCard
            label="Despesas totais"
            value={summary?.totalExpenses}
            isLoading={summaryLoading}
            valueClass="text-red-400"
            prev={prevSummary?.totalExpenses}
          />
          <SummaryCard
            label="Economia"
            value={summary?.balance}
            isLoading={summaryLoading}
            valueClass={summary && summary.balance >= 0 ? "text-sky-400" : "text-red-400"}
            prev={prevSummary?.balance}
          />
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs text-zinc-400">Taxa de economia</p>
            {summaryLoading ? (
              <Skeleton className="mt-2 h-7 w-24" />
            ) : (
              <p className={cn("mt-2 text-2xl font-bold", savingsRate >= 0 ? "text-emerald-400" : "text-red-400")}>
                {savingsRate.toFixed(1)}%
              </p>
            )}
            {prevSummary && (
              <p className="mt-1 text-xs text-zinc-500">
                Período anterior: {prevSummary.totalIncome > 0 ? (((prevSummary.totalIncome - prevSummary.totalExpenses) / prevSummary.totalIncome) * 100).toFixed(1) : "0.0"}%
              </p>
            )}
          </div>

          {hourlyRate && (
            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <p className="text-xs text-zinc-400">Horas de vida</p>
              {summaryLoading ? (
                <Skeleton className="mt-2 h-7 w-24" />
              ) : (
                <p className="mt-2 text-2xl font-bold text-amber-400">
                  {summary ? (summary.totalExpenses / hourlyRate).toFixed(1) : "0.0"}h
                </p>
              )}
              <p className="mt-1 text-xs text-zinc-500">
                @ {formatCurrency(hourlyRate)}/h
              </p>
            </div>
          )}
        </div>

        {/* Evolution Chart */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-5">
          <h2 className="mb-4 text-sm font-medium text-zinc-300">Evolução do saldo</h2>
          {txLoading ? (
            <Skeleton className="h-64 w-full rounded-xl" />
          ) : (
            <FinancialEvolutionChart data={evolutionData} />
          )}
        </div>

        {/* Monthly Breakdown */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-5">
          <h2 className="mb-4 text-sm font-medium text-zinc-300">Balanço mensal (últimos 6 meses)</h2>
          <MonthlyBalanceChart data={monthlyData} />
        </div>

        {/* Previous period comparison */}
        {prevSummary && (
          <div className="rounded-xl border border-white/10 bg-white/5 p-5">
            <h2 className="mb-4 text-sm font-medium text-zinc-300">Comparativo com período anterior</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <CompareRow label="Receitas" current={summary?.totalIncome ?? 0} prev={prevSummary.totalIncome} />
              <CompareRow label="Despesas" current={summary?.totalExpenses ?? 0} prev={prevSummary.totalExpenses} higherIsBad />
              <CompareRow label="Economia" current={summary?.balance ?? 0} prev={prevSummary.balance} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function SummaryCard({
  label,
  value,
  isLoading,
  valueClass,
  prev,
}: {
  label: string
  value?: number
  isLoading?: boolean
  valueClass: string
  prev?: number
}) {
  const diff = value !== undefined && prev !== undefined ? value - prev : undefined

  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <p className="text-xs text-zinc-400">{label}</p>
      {isLoading ? (
        <Skeleton className="mt-2 h-7 w-28" />
      ) : (
        <p className={cn("mt-2 text-2xl font-bold", valueClass)}>
          {formatCurrency(value ?? 0)}
        </p>
      )}
      {diff !== undefined && (
        <p className={cn("mt-1 text-xs", diff >= 0 ? "text-emerald-400" : "text-red-400")}>
          {diff >= 0 ? "+" : ""}{formatCurrency(diff)} vs período anterior
        </p>
      )}
    </div>
  )
}

function CompareRow({
  label,
  current,
  prev,
  higherIsBad,
}: {
  label: string
  current: number
  prev: number
  higherIsBad?: boolean
}) {
  const diff = current - prev
  const isGood = higherIsBad ? diff <= 0 : diff >= 0
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-3">
      <p className="text-xs text-zinc-400 mb-2">{label}</p>
      <p className="text-lg font-semibold text-zinc-100">{formatCurrency(current)}</p>
      <p className="text-xs text-zinc-500">Anterior: {formatCurrency(prev)}</p>
      <p className={cn("mt-1 text-xs font-medium", isGood ? "text-emerald-400" : "text-red-400")}>
        {diff >= 0 ? "+" : ""}{formatCurrency(diff)}
      </p>
    </div>
  )
}
