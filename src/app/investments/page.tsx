'use client'

import { useState } from "react"
import { useForm, Controller, type UseFormReturn } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Plus, Pencil, Trash2 } from "lucide-react"

import { useActiveUser } from "@/hooks/useActiveUser"
import {
  useInvestmentEntries,
  useCreateInvestmentEntry,
  useUpdateInvestmentEntry,
  useDeleteInvestmentEntry,
} from "@/hooks/useInvestmentEntries"

import type { InvestmentEntry } from "@/services/investment-entries.service"

import { getInvestmentDistribution } from "@/lib/investment-distribution"
import { ExpensesByCategoryChart } from "@/components/charts/ExpensesByCategoryChart"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { MoneyInput } from "@/components/ui/money-input"
import { CalendarInput } from "@/components/ui/calendar"

import { cn, formatCurrency, formatDate } from "@/lib/utils"

const today = new Date().toISOString().split("T")[0]

const investmentSchema = z.object({
  category: z.string().min(1, "Categoria é obrigatória"),
  value: z.number({ error: "Valor é obrigatório" }).positive("Valor deve ser maior que zero"),
  current_value: z.number().nullable().optional(),
  date: z.string().min(1, "Data é obrigatória"),
  description: z.string().optional().nullable(),
})

type InvestmentFormData = z.infer<typeof investmentSchema>

function defaultValues(): InvestmentFormData {
  return { category: "", value: 0, current_value: null, date: today, description: null }
}

export default function InvestmentsPage() {
  const { activeUserId } = useActiveUser()
  const userId = activeUserId ?? ""

  const [openCreate, setOpenCreate] = useState(false)
  const [editItem, setEditItem] = useState<InvestmentEntry | null>(null)

  const { data: entries, isLoading } = useInvestmentEntries(userId)
  const createMutation = useCreateInvestmentEntry(userId)
  const updateMutation = useUpdateInvestmentEntry(userId)
  const deleteMutation = useDeleteInvestmentEntry(userId)

  const createForm = useForm<InvestmentFormData>({
    resolver: zodResolver(investmentSchema),
    defaultValues: defaultValues(),
  })

  const editForm = useForm<InvestmentFormData>({
    resolver: zodResolver(investmentSchema),
    defaultValues: defaultValues(),
  })

  const onCreateSubmit = createForm.handleSubmit(async (data) => {
    if (!userId) return
    try {
      await createMutation.mutateAsync({
        user_id: userId,
        category: data.category,
        value: data.value,
        current_value: data.current_value ?? null,
        date: data.date,
        description: data.description ?? null,
      })
      setOpenCreate(false)
      createForm.reset(defaultValues())
    } catch (err) {
      console.error(err)
    }
  })

  const onEditSubmit = editForm.handleSubmit(async (data) => {
    if (!editItem) return
    try {
      await updateMutation.mutateAsync({
        id: editItem.id,
        data: {
          category: data.category,
          value: data.value,
          current_value: data.current_value ?? null,
          date: data.date,
          description: data.description ?? null,
        },
      })
      setEditItem(null)
    } catch (err) {
      console.error(err)
    }
  })

  function openEdit(item: InvestmentEntry) {
    setEditItem(item)
    editForm.reset({
      category: item.category,
      value: item.value,
      current_value: item.current_value ?? null,
      date: item.date,
      description: item.description ?? null,
    })
  }

  async function handleDelete(id: string) {
    try {
      await deleteMutation.mutateAsync(id)
    } catch (err) {
      console.error(err)
    }
  }

  const distribution = getInvestmentDistribution(entries ?? [])
  const chartData = distribution.items.map((item) => ({
    name: item.category,
    value: item.totalValue,
  }))

  return (
    <div className="space-y-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Investimentos</h1>
            <p className="mt-1 text-sm text-muted-foreground">Gerencie sua carteira de investimentos</p>
          </div>
          <Button onClick={() => setOpenCreate(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Investimento
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 sm:grid-cols-4">
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs text-zinc-400">Total investido</p>
            {isLoading ? (
              <Skeleton className="mt-2 h-7 w-24" />
            ) : (
              <p className="mt-2 text-xl font-bold text-zinc-100">{formatCurrency(distribution.totalValue)}</p>
            )}
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs text-zinc-400">Valor atual</p>
            {isLoading ? (
              <Skeleton className="mt-2 h-7 w-24" />
            ) : (
              <p className="mt-2 text-xl font-bold text-zinc-100">{formatCurrency(distribution.totalCurrentValue)}</p>
            )}
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs text-zinc-400">Lucro/Prejuízo</p>
            {isLoading ? (
              <Skeleton className="mt-2 h-7 w-24" />
            ) : (
              <p className={cn("mt-2 text-xl font-bold", distribution.profitLoss >= 0 ? "text-emerald-400" : "text-red-400")}>
                {distribution.profitLoss >= 0 ? "+" : ""}{formatCurrency(distribution.profitLoss)}
              </p>
            )}
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-xs text-zinc-400">Rentabilidade</p>
            {isLoading ? (
              <Skeleton className="mt-2 h-7 w-20" />
            ) : (
              <p className={cn("mt-2 text-xl font-bold", distribution.profitLossPercent >= 0 ? "text-emerald-400" : "text-red-400")}>
                {distribution.profitLossPercent >= 0 ? "+" : ""}{distribution.profitLossPercent.toFixed(2)}%
              </p>
            )}
          </div>
        </div>

        {/* Distribution Chart */}
        {chartData.length > 0 && (
          <div className="rounded-xl border border-white/10 bg-white/5 p-5">
            <h2 className="mb-4 text-sm font-medium text-zinc-300">Distribuição por categoria</h2>
            <ExpensesByCategoryChart data={chartData} />
          </div>
        )}

        {/* Entries Table */}
        <div className="rounded-xl border border-white/10 bg-white/5">
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="text-zinc-400">Data</TableHead>
                <TableHead className="text-zinc-400">Categoria</TableHead>
                <TableHead className="text-zinc-400">Descrição</TableHead>
                <TableHead className="text-right text-zinc-400">Valor investido</TableHead>
                <TableHead className="text-right text-zinc-400">Valor atual</TableHead>
                <TableHead className="text-right text-zinc-400">Retorno</TableHead>
                <TableHead className="text-right text-zinc-400">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i} className="border-white/10">
                    {Array.from({ length: 7 }).map((_, j) => (
                      <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                    ))}
                  </TableRow>
                ))
              ) : !entries || entries.length === 0 ? (
                <TableRow className="border-white/10">
                  <TableCell colSpan={7} className="py-12 text-center text-zinc-500">
                    Nenhum investimento cadastrado ainda.
                  </TableCell>
                </TableRow>
              ) : (
                entries.map((entry) => {
                  const currentVal = entry.current_value ?? entry.value
                  const returnAmt = currentVal - entry.value
                  return (
                    <TableRow key={entry.id} className="border-white/10 hover:bg-white/5">
                      <TableCell className="text-zinc-300">{formatDate(entry.date)}</TableCell>
                      <TableCell className="font-medium text-zinc-100">{entry.category}</TableCell>
                      <TableCell className="text-zinc-400">{entry.description ?? "—"}</TableCell>
                      <TableCell className="text-right text-zinc-300">{formatCurrency(entry.value)}</TableCell>
                      <TableCell className="text-right text-zinc-300">{formatCurrency(currentVal)}</TableCell>
                      <TableCell className={cn("text-right font-medium", returnAmt >= 0 ? "text-emerald-400" : "text-red-400")}>
                        {returnAmt >= 0 ? "+" : ""}{formatCurrency(returnAmt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" className="h-8 px-2" onClick={() => openEdit(entry)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            className="h-8 px-2 text-red-400 hover:bg-red-500/10 hover:text-red-400"
                            onClick={() => handleDelete(entry.id)}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Create Dialog */}
      <Dialog open={openCreate} onOpenChange={setOpenCreate}>
        <DialogContent className="border-white/10 bg-zinc-900 text-zinc-100 sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Novo Investimento</DialogTitle>
          </DialogHeader>
          <form onSubmit={onCreateSubmit} className="space-y-4">
            <InvestmentFormFields form={createForm} />
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setOpenCreate(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={Boolean(editItem)} onOpenChange={(open) => { if (!open) setEditItem(null) }}>
        <DialogContent className="border-white/10 bg-zinc-900 text-zinc-100 sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Investimento</DialogTitle>
          </DialogHeader>
          <form onSubmit={onEditSubmit} className="space-y-4">
            <InvestmentFormFields form={editForm} />
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setEditItem(null)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function InvestmentFormFields({ form }: { form: UseFormReturn<InvestmentFormData> }) {
  return (
    <>
      <div className="space-y-1.5">
        <Label>Categoria</Label>
        <Input
          {...form.register("category")}
          placeholder="Ex: Renda Fixa, Ações, FII..."
          className="border-white/10 bg-white/5 text-zinc-100 placeholder:text-zinc-500"
        />
        {form.formState.errors.category && (
          <p className="text-xs text-red-400">{form.formState.errors.category.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Valor investido</Label>
          <Controller
            control={form.control}
            name="value"
            render={({ field }) => (
              <MoneyInput value={field.value} onChange={(v) => field.onChange(v ?? 0)} />
            )}
          />
          {form.formState.errors.value && (
            <p className="text-xs text-red-400">{form.formState.errors.value.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label>Valor atual (opcional)</Label>
          <Controller
            control={form.control}
            name="current_value"
            render={({ field }) => (
              <MoneyInput value={field.value ?? null} onChange={(v) => field.onChange(v)} />
            )}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Data</Label>
        <Controller
          control={form.control}
          name="date"
          render={({ field }) => (
            <CalendarInput value={field.value} onChange={(e) => field.onChange(e.target.value)} />
          )}
        />
        {form.formState.errors.date && (
          <p className="text-xs text-red-400">{form.formState.errors.date.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label>Descrição (opcional)</Label>
        <Input
          {...form.register("description")}
          placeholder="Ex: Tesouro Direto 2026..."
          className="border-white/10 bg-white/5 text-zinc-100 placeholder:text-zinc-500"
        />
      </div>
    </>
  )
}
