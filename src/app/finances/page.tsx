'use client'

import { useState } from "react"
import { useForm, Controller, type UseFormReturn } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Plus, Pencil, Trash2 } from "lucide-react"
import { format } from "date-fns"

import { useActiveUser } from "@/hooks/useActiveUser"
import { useTransactions, useCreateTransaction, useUpdateTransaction, useDeleteTransaction } from "@/hooks/useTransactions"
import { useCategories } from "@/hooks/useCategories"

import type { FinancialTransaction, TransactionType, TransactionStatus } from "@/services/transactions.service"
import type { Category } from "@/services/categories.service"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
import { getDateRange, type PeriodPreset } from "@/lib/period"

const transactionSchema = z.object({
  description: z.string().min(1, "Descrição é obrigatória"),
  type: z.enum(["income", "expense"] as const),
  amount: z.number({ error: "Valor é obrigatório" }).positive("Valor deve ser maior que zero"),
  due_date: z.string().min(1, "Data é obrigatória"),
  status: z.enum(["pending", "paid", "late", "cancelled"] as const),
  category_id: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
})

type TransactionFormData = z.infer<typeof transactionSchema>

const periodPresets: { label: string; value: Exclude<PeriodPreset, "custom"> }[] = [
  { label: "Hoje", value: "today" },
  { label: "7d", value: "7d" },
  { label: "30d", value: "30d" },
  { label: "Mês", value: "month" },
  { label: "Ano", value: "year" },
]

const statusBadgeVariant: Record<TransactionStatus, "warning" | "success" | "destructive" | "secondary"> = {
  pending: "warning",
  paid: "success",
  late: "destructive",
  cancelled: "secondary",
}

const statusLabels: Record<TransactionStatus, string> = {
  pending: "Pendente",
  paid: "Pago",
  late: "Atrasado",
  cancelled: "Cancelado",
}

const today = new Date().toISOString().split("T")[0]

function defaultValues(): TransactionFormData {
  return {
    description: "",
    type: "expense",
    amount: 0,
    due_date: today,
    status: "pending",
    category_id: null,
    notes: null,
  }
}

export default function FinancesPage() {
  const { activeUserId } = useActiveUser()
  const userId = activeUserId ?? ""

  const [period, setPeriod] = useState<Exclude<PeriodPreset, "custom">>("month")
  const [typeFilter, setTypeFilter] = useState<TransactionType | "">("")
  const [statusFilter, setStatusFilter] = useState<TransactionStatus | "">("")
  const [openCreate, setOpenCreate] = useState(false)
  const [editItem, setEditItem] = useState<FinancialTransaction | null>(null)

  const dateRange = getDateRange(period)
  const dateFrom = format(dateRange.from, "yyyy-MM-dd")
  const dateTo = format(dateRange.to, "yyyy-MM-dd")

  const filters = {
    dateFrom,
    dateTo,
    ...(typeFilter ? { type: typeFilter as TransactionType } : {}),
    ...(statusFilter ? { status: statusFilter as TransactionStatus } : {}),
  }

  const { data: transactions, isLoading } = useTransactions(userId, filters)
  const { data: categories } = useCategories(userId)
  const createMutation = useCreateTransaction(userId, filters)
  const updateMutation = useUpdateTransaction(userId)
  const deleteMutation = useDeleteTransaction(userId)

  const createForm = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: defaultValues(),
  })

  const editForm = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: defaultValues(),
  })

  const onCreateSubmit = createForm.handleSubmit(async (data) => {
    if (!userId) return
    try {
      await createMutation.mutateAsync({
        user_id: userId,
        description: data.description,
        type: data.type,
        amount: data.amount,
        due_date: data.due_date,
        status: data.status,
        category_id: data.category_id ?? null,
        notes: data.notes ?? null,
        payment_date: null,
        payment_method: null,
        is_recurring: false,
        recurrence_type: null,
        recurrence_interval: null,
        recurrence_source_id: null,
        recurrence_start_date: null,
        recurrence_end_date: null,
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
          description: data.description,
          type: data.type,
          amount: data.amount,
          due_date: data.due_date,
          status: data.status,
          category_id: data.category_id ?? null,
          notes: data.notes ?? null,
        },
      })
      setEditItem(null)
    } catch (err) {
      console.error(err)
    }
  })

  function openEdit(item: FinancialTransaction) {
    setEditItem(item)
    editForm.reset({
      description: item.description,
      type: item.type,
      amount: item.amount,
      due_date: item.due_date,
      status: item.status,
      category_id: item.category_id ?? null,
      notes: item.notes ?? null,
    })
  }

  async function handleDelete(id: string) {
    try {
      await deleteMutation.mutateAsync(id)
    } catch (err) {
      console.error(err)
    }
  }

  function getCategoryName(id: string | null) {
    if (!id || !categories) return "—"
    return categories.find((c) => c.id === id)?.name ?? "—"
  }

  return (
    <div className="min-h-screen bg-zinc-900 p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-100">Finanças</h1>
            <p className="mt-1 text-sm text-zinc-400">Gerencie suas transações financeiras</p>
          </div>
          <Button onClick={() => setOpenCreate(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Transação
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-4">
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

          <div className="h-5 w-px bg-white/10" />

          {/* Type filter */}
          <Select value={typeFilter || "all"} onValueChange={(v) => setTypeFilter(v === "all" ? "" : v as TransactionType)}>
            <SelectTrigger className="h-9 w-36 rounded-lg border-white/10 bg-white/5 text-xs text-zinc-300">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os tipos</SelectItem>
              <SelectItem value="income">Receitas</SelectItem>
              <SelectItem value="expense">Despesas</SelectItem>
            </SelectContent>
          </Select>

          {/* Status filter */}
          <Select value={statusFilter || "all"} onValueChange={(v) => setStatusFilter(v === "all" ? "" : v as TransactionStatus)}>
            <SelectTrigger className="h-9 w-36 rounded-lg border-white/10 bg-white/5 text-xs text-zinc-300">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="pending">Pendente</SelectItem>
              <SelectItem value="paid">Pago</SelectItem>
              <SelectItem value="late">Atrasado</SelectItem>
              <SelectItem value="cancelled">Cancelado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="rounded-xl border border-white/10 bg-white/5">
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="text-zinc-400">Data</TableHead>
                <TableHead className="text-zinc-400">Descrição</TableHead>
                <TableHead className="text-zinc-400">Categoria</TableHead>
                <TableHead className="text-right text-zinc-400">Valor</TableHead>
                <TableHead className="text-zinc-400">Status</TableHead>
                <TableHead className="text-right text-zinc-400">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i} className="border-white/10">
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    <TableCell><Skeleton className="ml-auto h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="ml-auto h-8 w-20" /></TableCell>
                  </TableRow>
                ))
              ) : !transactions || transactions.length === 0 ? (
                <TableRow className="border-white/10">
                  <TableCell colSpan={6} className="py-12 text-center text-zinc-500">
                    Nenhuma transação encontrada para o período selecionado.
                  </TableCell>
                </TableRow>
              ) : (
                transactions.map((t) => (
                  <TableRow key={t.id} className="border-white/10 hover:bg-white/5">
                    <TableCell className="text-zinc-300">{formatDate(t.due_date)}</TableCell>
                    <TableCell className="font-medium text-zinc-100">{t.description}</TableCell>
                    <TableCell className="text-zinc-400">{getCategoryName(t.category_id)}</TableCell>
                    <TableCell className={cn("text-right font-medium", t.type === "income" ? "text-emerald-400" : "text-red-400")}>
                      {t.type === "income" ? "+" : "-"}{formatCurrency(t.amount)}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusBadgeVariant[t.status]}>{statusLabels[t.status]}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" className="h-8 px-2" onClick={() => openEdit(t)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          className="h-8 px-2 text-red-400 hover:bg-red-500/10 hover:text-red-400"
                          onClick={() => handleDelete(t.id)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Create Dialog */}
      <Dialog open={openCreate} onOpenChange={setOpenCreate}>
        <DialogContent className="border-white/10 bg-zinc-900 text-zinc-100 sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Nova Transação</DialogTitle>
          </DialogHeader>
          <form onSubmit={onCreateSubmit} className="space-y-4">
            <TransactionFormFields form={createForm} categories={categories ?? []} />
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
        <DialogContent className="border-white/10 bg-zinc-900 text-zinc-100 sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Editar Transação</DialogTitle>
          </DialogHeader>
          <form onSubmit={onEditSubmit} className="space-y-4">
            <TransactionFormFields form={editForm} categories={categories ?? []} />
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

function TransactionFormFields({
  form,
  categories,
}: {
  form: UseFormReturn<TransactionFormData>
  categories: Category[]
}) {
  return (
    <>
      <div className="space-y-1.5">
        <Label>Descrição</Label>
        <Input
          {...form.register("description")}
          placeholder="Ex: Salário, Aluguel..."
          className="border-white/10 bg-white/5 text-zinc-100 placeholder:text-zinc-500"
        />
        {form.formState.errors.description && (
          <p className="text-xs text-red-400">{form.formState.errors.description.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label>Tipo</Label>
        <Controller
          control={form.control}
          name="type"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger className="border-white/10 bg-white/5 text-zinc-100">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="income">Receita</SelectItem>
                <SelectItem value="expense">Despesa</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
        {form.formState.errors.type && (
          <p className="text-xs text-red-400">{form.formState.errors.type.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label>Valor</Label>
        <Controller
          control={form.control}
          name="amount"
          render={({ field }) => (
            <MoneyInput value={field.value} onChange={(v) => field.onChange(v ?? 0)} />
          )}
        />
        {form.formState.errors.amount && (
          <p className="text-xs text-red-400">{form.formState.errors.amount.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label>Data de vencimento</Label>
        <Controller
          control={form.control}
          name="due_date"
          render={({ field }) => (
            <CalendarInput value={field.value} onChange={(e) => field.onChange(e.target.value)} />
          )}
        />
        {form.formState.errors.due_date && (
          <p className="text-xs text-red-400">{form.formState.errors.due_date.message}</p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label>Status</Label>
        <Controller
          control={form.control}
          name="status"
          render={({ field }) => (
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger className="border-white/10 bg-white/5 text-zinc-100">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="paid">Pago</SelectItem>
                <SelectItem value="late">Atrasado</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          )}
        />
      </div>

      {categories.length > 0 && (
        <div className="space-y-1.5">
          <Label>Categoria (opcional)</Label>
          <Controller
            control={form.control}
            name="category_id"
            render={({ field }) => (
              <Select value={field.value ?? "none"} onValueChange={(v) => field.onChange(v === "none" ? null : v)}>
                <SelectTrigger className="border-white/10 bg-white/5 text-zinc-100">
                  <SelectValue placeholder="Selecionar categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem categoria</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
      )}

      <div className="space-y-1.5">
        <Label>Notas (opcional)</Label>
        <textarea
          {...form.register("notes")}
          placeholder="Observações adicionais..."
          rows={3}
          className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-400/20 resize-none"
        />
      </div>
    </>
  )
}
