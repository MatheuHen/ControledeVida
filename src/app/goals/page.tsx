'use client'

import { useState } from "react"
import { useForm, Controller, type UseFormReturn } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Plus, Pencil, Trash2 } from "lucide-react"

import { useActiveUser } from "@/hooks/useActiveUser"
import { useGoals, useCreateGoal, useUpdateGoal, useDeleteGoal } from "@/hooks/useGoals"

import type { Goal, GoalType, GoalStatus } from "@/services/goals.service"

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
import { MoneyInput } from "@/components/ui/money-input"
import { CalendarInput } from "@/components/ui/calendar"

import { cn, formatCurrency, formatDate } from "@/lib/utils"

const today = new Date().toISOString().split("T")[0]

const goalSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  type: z.enum(["economy", "limit", "debt"] as const),
  target_amount: z.number({ error: "Valor alvo é obrigatório" }).positive("Valor deve ser maior que zero"),
  current_amount: z.number().min(0),
  status: z.enum(["active", "completed", "failed", "paused", "late"] as const),
  start_date: z.string().min(1, "Data de início é obrigatória"),
  end_date: z.string().min(1, "Data de fim é obrigatória"),
  description: z.string().optional().nullable(),
})

type GoalFormData = z.infer<typeof goalSchema>

const goalTypeLabels: Record<GoalType, string> = {
  economy: "Economia",
  limit: "Limite",
  debt: "Dívida",
}

const goalStatusLabels: Record<GoalStatus, string> = {
  active: "Ativa",
  completed: "Concluída",
  failed: "Falhou",
  paused: "Pausada",
  late: "Atrasada",
}

const goalStatusVariant: Record<GoalStatus, "success" | "destructive" | "secondary" | "warning"> = {
  active: "success",
  completed: "success",
  failed: "destructive",
  paused: "secondary",
  late: "warning",
}

function defaultValues(): GoalFormData {
  return {
    name: "",
    type: "economy",
    target_amount: 0,
    current_amount: 0,
    status: "active",
    start_date: today,
    end_date: today,
    description: null,
  }
}

export default function GoalsPage() {
  const { activeUserId } = useActiveUser()
  const userId = activeUserId ?? ""

  const [openCreate, setOpenCreate] = useState(false)
  const [editItem, setEditItem] = useState<Goal | null>(null)

  const { data: goals, isLoading } = useGoals(userId)
  const createMutation = useCreateGoal(userId)
  const updateMutation = useUpdateGoal(userId)
  const deleteMutation = useDeleteGoal(userId)

  const createForm = useForm<GoalFormData>({
    resolver: zodResolver(goalSchema),
    defaultValues: defaultValues(),
  })

  const editForm = useForm<GoalFormData>({
    resolver: zodResolver(goalSchema),
    defaultValues: defaultValues(),
  })

  const onCreateSubmit = createForm.handleSubmit(async (data) => {
    if (!userId) return
    try {
      await createMutation.mutateAsync({
        user_id: userId,
        name: data.name,
        type: data.type,
        target_amount: data.target_amount,
        current_amount: data.current_amount ?? 0,
        status: data.status,
        start_date: data.start_date,
        end_date: data.end_date,
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
          name: data.name,
          type: data.type,
          target_amount: data.target_amount,
          current_amount: data.current_amount ?? 0,
          status: data.status,
          start_date: data.start_date,
          end_date: data.end_date,
          description: data.description ?? null,
        },
      })
      setEditItem(null)
    } catch (err) {
      console.error(err)
    }
  })

  function openEdit(item: Goal) {
    setEditItem(item)
    editForm.reset({
      name: item.name,
      type: item.type,
      target_amount: item.target_amount,
      current_amount: item.current_amount,
      status: item.status,
      start_date: item.start_date,
      end_date: item.end_date,
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

  return (
    <div className="min-h-screen bg-zinc-900 p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-zinc-100">Metas</h1>
            <p className="mt-1 text-sm text-zinc-400">Acompanhe suas metas financeiras</p>
          </div>
          <Button onClick={() => setOpenCreate(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Meta
          </Button>
        </div>

        {/* Goals Grid */}
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-white/10 bg-white/5 p-5 space-y-3">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-2 w-full rounded-full" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        ) : !goals || goals.length === 0 ? (
          <div className="flex h-48 items-center justify-center rounded-xl border border-white/10 bg-white/5">
            <p className="text-zinc-500">Nenhuma meta cadastrada ainda.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {goals.map((goal) => {
              const progress = goal.target_amount > 0
                ? Math.min((goal.current_amount / goal.target_amount) * 100, 100)
                : 0

              return (
                <div key={goal.id} className="group relative rounded-xl border border-white/10 bg-white/5 p-5 space-y-4">
                  {/* Actions */}
                  <div className="absolute right-3 top-3 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <Button variant="ghost" className="h-8 px-2" onClick={() => openEdit(goal)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      className="h-8 px-2 text-red-400 hover:bg-red-500/10 hover:text-red-400"
                      onClick={() => handleDelete(goal.id)}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  {/* Header */}
                  <div className="space-y-1.5 pr-16">
                    <p className="font-semibold text-zinc-100 leading-tight">{goal.name}</p>
                    <div className="flex flex-wrap gap-1.5">
                      <Badge variant="outline">{goalTypeLabels[goal.type]}</Badge>
                      <Badge variant={goalStatusVariant[goal.status]}>{goalStatusLabels[goal.status]}</Badge>
                    </div>
                  </div>

                  {/* Description */}
                  {goal.description && (
                    <p className="text-xs text-zinc-500 line-clamp-2">{goal.description}</p>
                  )}

                  {/* Progress */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-zinc-400">{formatCurrency(goal.current_amount)}</span>
                      <span className="text-zinc-500">{formatCurrency(goal.target_amount)}</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-white/10">
                      <div
                        className={cn(
                          "h-2 rounded-full transition-all",
                          progress >= 100 ? "bg-emerald-500" : "bg-emerald-500/70"
                        )}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <p className="text-right text-xs text-zinc-400">{progress.toFixed(1)}%</p>
                  </div>

                  {/* Dates */}
                  <div className="flex justify-between text-xs text-zinc-500">
                    <span>Início: {formatDate(goal.start_date)}</span>
                    <span>Fim: {formatDate(goal.end_date)}</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={openCreate} onOpenChange={setOpenCreate}>
        <DialogContent className="border-white/10 bg-zinc-900 text-zinc-100 sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Nova Meta</DialogTitle>
          </DialogHeader>
          <form onSubmit={onCreateSubmit} className="space-y-4">
            <GoalFormFields form={createForm} />
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
            <DialogTitle>Editar Meta</DialogTitle>
          </DialogHeader>
          <form onSubmit={onEditSubmit} className="space-y-4">
            <GoalFormFields form={editForm} />
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

function GoalFormFields({ form }: { form: UseFormReturn<GoalFormData, any, GoalFormData> }) {
  return (
    <>
      <div className="space-y-1.5">
        <Label>Nome</Label>
        <Input
          {...form.register("name")}
          placeholder="Ex: Reserva de emergência..."
          className="border-white/10 bg-white/5 text-zinc-100 placeholder:text-zinc-500"
        />
        {form.formState.errors.name && (
          <p className="text-xs text-red-400">{form.formState.errors.name.message}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
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
                  <SelectItem value="economy">Economia</SelectItem>
                  <SelectItem value="limit">Limite</SelectItem>
                  <SelectItem value="debt">Dívida</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
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
                  <SelectItem value="active">Ativa</SelectItem>
                  <SelectItem value="completed">Concluída</SelectItem>
                  <SelectItem value="failed">Falhou</SelectItem>
                  <SelectItem value="paused">Pausada</SelectItem>
                  <SelectItem value="late">Atrasada</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Valor alvo</Label>
          <Controller
            control={form.control}
            name="target_amount"
            render={({ field }) => (
              <MoneyInput value={field.value} onChange={(v) => field.onChange(v ?? 0)} />
            )}
          />
          {form.formState.errors.target_amount && (
            <p className="text-xs text-red-400">{form.formState.errors.target_amount.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label>Valor atual</Label>
          <Controller
            control={form.control}
            name="current_amount"
            render={({ field }) => (
              <MoneyInput value={field.value} onChange={(v) => field.onChange(v ?? 0)} />
            )}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Data início</Label>
          <Controller
            control={form.control}
            name="start_date"
            render={({ field }) => (
              <CalendarInput value={field.value} onChange={(e) => field.onChange(e.target.value)} />
            )}
          />
          {form.formState.errors.start_date && (
            <p className="text-xs text-red-400">{form.formState.errors.start_date.message}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label>Data fim</Label>
          <Controller
            control={form.control}
            name="end_date"
            render={({ field }) => (
              <CalendarInput value={field.value} onChange={(e) => field.onChange(e.target.value)} />
            )}
          />
          {form.formState.errors.end_date && (
            <p className="text-xs text-red-400">{form.formState.errors.end_date.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Descrição (opcional)</Label>
        <textarea
          {...form.register("description")}
          placeholder="Descreva sua meta..."
          rows={3}
          className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-400/20 resize-none"
        />
      </div>
    </>
  )
}
