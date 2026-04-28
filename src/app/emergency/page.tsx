'use client'

import { useState } from "react"
import { useForm, Controller, type UseFormReturn } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Plus, Pencil, Trash2 } from "lucide-react"

import { useActiveUser } from "@/hooks/useActiveUser"
import {
  useReserveEntries,
  useCreateReserveEntry,
  useUpdateReserveEntry,
  useDeleteReserveEntry,
} from "@/hooks/useReserveEntries"

import type { ReserveEntry } from "@/services/reserve-entries.service"

import { FinancialEvolutionChart } from "@/components/charts/FinancialEvolutionChart"

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

const today = new Date().toISOString().split("T")[0]

const reserveSchema = z.object({
  type: z.enum(["deposit", "withdrawal"] as const),
  amount: z.number({ error: "Valor é obrigatório" }).positive("Valor deve ser maior que zero"),
  date: z.string().min(1, "Data é obrigatória"),
  description: z.string().optional().nullable(),
})

type ReserveFormData = z.infer<typeof reserveSchema>

function defaultValues(): ReserveFormData {
  return { type: "deposit", amount: 0, date: today, description: null }
}

export default function EmergencyPage() {
  const { activeUserId } = useActiveUser()
  const userId = activeUserId ?? ""

  const [openCreate, setOpenCreate] = useState(false)
  const [editItem, setEditItem] = useState<ReserveEntry | null>(null)

  const { data: entries, isLoading } = useReserveEntries(userId)
  const createMutation = useCreateReserveEntry(userId)
  const updateMutation = useUpdateReserveEntry(userId)
  const deleteMutation = useDeleteReserveEntry(userId)

  const createForm = useForm<ReserveFormData>({
    resolver: zodResolver(reserveSchema),
    defaultValues: defaultValues(),
  })

  const editForm = useForm<ReserveFormData>({
    resolver: zodResolver(reserveSchema),
    defaultValues: defaultValues(),
  })

  const onCreateSubmit = createForm.handleSubmit(async (data) => {
    if (!userId) return
    try {
      await createMutation.mutateAsync({
        user_id: userId,
        type: data.type,
        amount: data.amount,
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
          type: data.type,
          amount: data.amount,
          date: data.date,
          description: data.description ?? null,
        },
      })
      setEditItem(null)
    } catch (err) {
      console.error(err)
    }
  })

  function openEdit(item: ReserveEntry) {
    setEditItem(item)
    editForm.reset({
      type: item.type,
      amount: item.amount,
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

  // Total reserve (deposits positive, withdrawals negative)
  const totalReserve = (entries ?? []).reduce((sum, e) => {
    return sum + (e.type === "deposit" ? e.amount : -e.amount)
  }, 0)

  // Evolution data (cumulative sum, sorted by date asc)
  const evolutionData = (() => {
    if (!entries || entries.length === 0) return []
    const sorted = [...entries].sort((a, b) => a.date.localeCompare(b.date))
    let running = 0
    return sorted.map((e) => {
      running += e.type === "deposit" ? e.amount : -e.amount
      return { date: formatDate(e.date), saldo: running }
    })
  })()

  return (
    <div className="space-y-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Reserva de Emergência</h1>
            <p className="mt-1 text-sm text-muted-foreground">Acompanhe sua reserva financeira</p>
          </div>
          <Button onClick={() => setOpenCreate(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Entrada
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-white/5 p-5">
            <p className="text-xs text-zinc-400">Total da Reserva</p>
            {isLoading ? (
              <Skeleton className="mt-2 h-8 w-32" />
            ) : (
              <p className={cn("mt-2 text-3xl font-bold", totalReserve >= 0 ? "text-emerald-400" : "text-red-400")}>
                {formatCurrency(totalReserve)}
              </p>
            )}
          </div>
          <div className="rounded-xl border border-white/10 bg-white/5 p-5">
            <p className="text-xs text-zinc-400">Número de entradas</p>
            {isLoading ? (
              <Skeleton className="mt-2 h-8 w-16" />
            ) : (
              <p className="mt-2 text-3xl font-bold text-zinc-100">
                {entries?.length ?? 0}
              </p>
            )}
          </div>
        </div>

        {/* Evolution Chart */}
        <div className="rounded-xl border border-white/10 bg-white/5 p-5">
          <h2 className="mb-4 text-sm font-medium text-zinc-300">Crescimento da reserva</h2>
          {isLoading ? (
            <Skeleton className="h-64 w-full rounded-xl" />
          ) : (
            <FinancialEvolutionChart data={evolutionData} />
          )}
        </div>

        {/* Entries Table */}
        <div className="rounded-xl border border-white/10 bg-white/5">
          <Table>
            <TableHeader>
              <TableRow className="border-white/10 hover:bg-transparent">
                <TableHead className="text-zinc-400">Data</TableHead>
                <TableHead className="text-zinc-400">Tipo</TableHead>
                <TableHead className="text-zinc-400">Descrição</TableHead>
                <TableHead className="text-right text-zinc-400">Valor</TableHead>
                <TableHead className="text-right text-zinc-400">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i} className="border-white/10">
                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                    <TableCell><Skeleton className="ml-auto h-4 w-20" /></TableCell>
                    <TableCell><Skeleton className="ml-auto h-8 w-20" /></TableCell>
                  </TableRow>
                ))
              ) : !entries || entries.length === 0 ? (
                <TableRow className="border-white/10">
                  <TableCell colSpan={5} className="py-12 text-center text-zinc-500">
                    Nenhuma entrada cadastrada ainda.
                  </TableCell>
                </TableRow>
              ) : (
                entries.map((entry) => (
                  <TableRow key={entry.id} className="border-white/10 hover:bg-white/5">
                    <TableCell className="text-zinc-300">{formatDate(entry.date)}</TableCell>
                    <TableCell>
                      <Badge variant={entry.type === "deposit" ? "success" : "warning"}>
                        {entry.type === "deposit" ? "Depósito" : "Retirada"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-zinc-400">{entry.description ?? "—"}</TableCell>
                    <TableCell className={cn("text-right font-medium", entry.type === "deposit" ? "text-emerald-400" : "text-red-400")}>
                      {entry.type === "deposit" ? "+" : "-"}{formatCurrency(entry.amount)}
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
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Create Dialog */}
      <Dialog open={openCreate} onOpenChange={setOpenCreate}>
        <DialogContent className="border-white/10 bg-zinc-900 text-zinc-100 sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nova Entrada</DialogTitle>
          </DialogHeader>
          <form onSubmit={onCreateSubmit} className="space-y-4">
            <ReserveFormFields form={createForm} />
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
            <DialogTitle>Editar Entrada</DialogTitle>
          </DialogHeader>
          <form onSubmit={onEditSubmit} className="space-y-4">
            <ReserveFormFields form={editForm} />
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

function ReserveFormFields({ form }: { form: UseFormReturn<ReserveFormData> }) {
  return (
    <>
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
                <SelectItem value="deposit">Depósito</SelectItem>
                <SelectItem value="withdrawal">Retirada</SelectItem>
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
          placeholder="Ex: Depósito mensal..."
          className="border-white/10 bg-white/5 text-zinc-100 placeholder:text-zinc-500"
        />
      </div>
    </>
  )
}
