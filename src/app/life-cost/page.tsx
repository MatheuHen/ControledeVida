'use client'

import { useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import Link from "next/link"
import { format } from "date-fns"
import { AlertTriangle } from "lucide-react"

import { useActiveUser } from "@/hooks/useActiveUser"
import { useFinancialSummary } from "@/hooks/useFinancialSummary"
import { useProfile } from "@/hooks/useProfile"
import { getDateRange, type PeriodPreset } from "@/lib/period"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { MoneyInput } from "@/components/ui/money-input"

import { cn, formatCurrency } from "@/lib/utils"

const periodPresets: { label: string; value: Exclude<PeriodPreset, "custom"> }[] = [
  { label: "Hoje", value: "today" },
  { label: "7d", value: "7d" },
  { label: "30d", value: "30d" },
  { label: "Mês", value: "month" },
  { label: "Ano", value: "year" },
]

const simulatorSchema = z.object({
  simulateAmount: z.number({ error: "Digite um valor" }).positive("Valor deve ser maior que zero"),
})

type SimulatorFormData = z.infer<typeof simulatorSchema>

export default function LifeCostPage() {
  const { activeUserId } = useActiveUser()
  const userId = activeUserId ?? ""

  const [period, setPeriod] = useState<Exclude<PeriodPreset, "custom">>("month")
  const [simResult, setSimResult] = useState<{ hours: number; days: number; weeks: number } | null>(null)

  const { data: profile, isLoading: profileLoading } = useProfile()
  const dateRange = getDateRange(period)
  const dateFrom = format(dateRange.from, "yyyy-MM-dd")
  const dateTo = format(dateRange.to, "yyyy-MM-dd")

  const { data: summary, isLoading: summaryLoading } = useFinancialSummary(userId, dateFrom, dateTo)

  const hourlyRate = profile?.hourly_rate

  const form = useForm<SimulatorFormData>({
    resolver: zodResolver(simulatorSchema),
    defaultValues: { simulateAmount: 0 },
  })

  const onSimulate = form.handleSubmit((data) => {
    if (!hourlyRate) return
    const hours = data.simulateAmount / hourlyRate
    const days = hours / 8
    const weeks = days / 5
    setSimResult({ hours, days, weeks })
  })

  const totalExpenses = summary?.totalExpenses ?? 0
  const lifeCostHours = hourlyRate ? totalExpenses / hourlyRate : null
  const lifeCostDays = lifeCostHours !== null ? lifeCostHours / 8 : null
  const lifeCostWeeks = lifeCostDays !== null ? lifeCostDays / 5 : null
  const lifeCostMonths = lifeCostDays !== null ? lifeCostDays / 22 : null

  if (profileLoading) {
    return (
      <div className="min-h-screen bg-zinc-900 p-6">
        <div className="mx-auto max-w-4xl space-y-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-32 w-full rounded-xl" />
        </div>
      </div>
    )
  }

  if (!hourlyRate) {
    return (
      <div className="min-h-screen bg-zinc-900 p-6">
        <div className="mx-auto max-w-4xl space-y-6">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-100">Custo de Vida</h1>
            <p className="mt-1 text-sm text-zinc-400">Descubra quanto da sua vida você gasta</p>
          </div>

          <div className="flex items-start gap-4 rounded-xl border border-yellow-500/30 bg-yellow-500/10 p-5">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-yellow-400" />
            <div>
              <p className="font-medium text-yellow-300">Configure seu valor por hora</p>
              <p className="mt-1 text-sm text-zinc-400">
                Para usar esta funcionalidade, você precisa configurar seu valor por hora nas Configurações.
              </p>
              <Link href="/settings">
                <Button className="mt-3">
                  Ir para Configurações
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-900 p-6">
      <div className="mx-auto max-w-4xl space-y-6">
        {/* Header + Period */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-100">Custo de Vida</h1>
            <p className="mt-1 text-sm text-zinc-400">
              Baseado em {formatCurrency(hourlyRate)}/hora
            </p>
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

        {/* Summary Cards */}
        <div className="grid gap-4 sm:grid-cols-4">
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs text-zinc-400">Total de despesas</p>
            {summaryLoading ? (
              <Skeleton className="mt-2 h-7 w-28" />
            ) : (
              <p className="mt-2 text-xl font-bold text-red-400">{formatCurrency(totalExpenses)}</p>
            )}
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs text-zinc-400">Horas de vida</p>
            {summaryLoading ? (
              <Skeleton className="mt-2 h-7 w-20" />
            ) : (
              <p className="mt-2 text-xl font-bold text-amber-400">
                {lifeCostHours !== null ? `${lifeCostHours.toFixed(1)}h` : "—"}
              </p>
            )}
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs text-zinc-400">Dias de trabalho</p>
            {summaryLoading ? (
              <Skeleton className="mt-2 h-7 w-20" />
            ) : (
              <p className="mt-2 text-xl font-bold text-orange-400">
                {lifeCostDays !== null ? `${lifeCostDays.toFixed(1)}d` : "—"}
              </p>
            )}
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs text-zinc-400">Semanas</p>
            {summaryLoading ? (
              <Skeleton className="mt-2 h-7 w-16" />
            ) : (
              <p className="mt-2 text-xl font-bold text-rose-400">
                {lifeCostWeeks !== null ? `${lifeCostWeeks.toFixed(2)}sem` : "—"}
              </p>
            )}
          </div>
        </div>

        {/* Conversions Table */}
        {!summaryLoading && lifeCostHours !== null && (
          <div className="rounded-xl border border-white/10 bg-white/5 p-5">
            <h2 className="mb-4 text-sm font-medium text-zinc-300">Seus gastos em tempo de vida</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { label: "Horas trabalhadas", value: `${lifeCostHours.toFixed(1)} horas`, color: "text-amber-400" },
                { label: "Dias úteis (8h/dia)", value: `${lifeCostDays!.toFixed(1)} dias`, color: "text-orange-400" },
                { label: "Semanas (5 dias/sem)", value: `${lifeCostWeeks!.toFixed(2)} semanas`, color: "text-rose-400" },
                { label: "Meses úteis (22 dias)", value: `${lifeCostMonths!.toFixed(2)} meses`, color: "text-red-400" },
              ].map((row) => (
                <div key={row.label} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-4 py-3">
                  <span className="text-sm text-zinc-400">{row.label}</span>
                  <span className={cn("font-semibold", row.color)}>{row.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Simulator */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-5">
          <h2 className="mb-1 text-sm font-medium text-zinc-300">Simulador</h2>
          <p className="mb-4 text-xs text-zinc-500">Calcule quanto custa um item em horas de vida</p>
          <form onSubmit={onSimulate} className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-48 space-y-1.5">
              <Label>Valor do item</Label>
              <Controller
                control={form.control}
                name="simulateAmount"
                render={({ field }) => (
                  <MoneyInput value={field.value} onChange={(v) => field.onChange(v ?? 0)} />
                )}
              />
              {form.formState.errors.simulateAmount && (
                <p className="text-xs text-red-400">{form.formState.errors.simulateAmount.message}</p>
              )}
            </div>
            <Button type="submit">Calcular</Button>
          </form>

          {simResult && (
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-center">
                <p className="text-xs text-zinc-400">Horas</p>
                <p className="mt-1 text-2xl font-bold text-amber-400">{simResult.hours.toFixed(1)}h</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-center">
                <p className="text-xs text-zinc-400">Dias úteis</p>
                <p className="mt-1 text-2xl font-bold text-orange-400">{simResult.days.toFixed(1)}d</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/5 p-3 text-center">
                <p className="text-xs text-zinc-400">Semanas</p>
                <p className="mt-1 text-2xl font-bold text-rose-400">{simResult.weeks.toFixed(2)}sem</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
