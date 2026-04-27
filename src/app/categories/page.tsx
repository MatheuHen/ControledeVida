'use client'

import { useState } from "react"
import { useForm, Controller, type UseFormReturn } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Plus, Pencil, Trash2 } from "lucide-react"

import { useActiveUser } from "@/hooks/useActiveUser"
import { useCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from "@/hooks/useCategories"

import type { Category } from "@/services/categories.service"
import type { TransactionType } from "@/services/transactions.service"

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

const categorySchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  type: z.enum(["income", "expense"] as const),
  color: z.string().optional().nullable(),
  icon: z.string().optional().nullable(),
})

type CategoryFormData = z.infer<typeof categorySchema>

function defaultValues(): CategoryFormData {
  return { name: "", type: "expense", color: "#10b981", icon: null }
}

export default function CategoriesPage() {
  const { activeUserId } = useActiveUser()
  const userId = activeUserId ?? ""

  const [openCreate, setOpenCreate] = useState(false)
  const [editItem, setEditItem] = useState<Category | null>(null)

  const { data: categories, isLoading } = useCategories(userId)
  const createMutation = useCreateCategory(userId)
  const updateMutation = useUpdateCategory(userId)
  const deleteMutation = useDeleteCategory(userId)

  const createForm = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: defaultValues(),
  })

  const editForm = useForm<CategoryFormData>({
    resolver: zodResolver(categorySchema),
    defaultValues: defaultValues(),
  })

  const onCreateSubmit = createForm.handleSubmit(async (data) => {
    if (!userId) return
    try {
      await createMutation.mutateAsync({
        user_id: userId,
        name: data.name,
        type: data.type,
        color: data.color ?? null,
        icon: data.icon ?? null,
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
          color: data.color ?? null,
          icon: data.icon ?? null,
        },
      })
      setEditItem(null)
    } catch (err) {
      console.error(err)
    }
  })

  function openEdit(item: Category) {
    setEditItem(item)
    editForm.reset({
      name: item.name,
      type: item.type,
      color: item.color ?? "#10b981",
      icon: item.icon ?? null,
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
            <h1 className="text-2xl font-semibold text-zinc-100">Categorias</h1>
            <p className="mt-1 text-sm text-zinc-400">Organize suas transações por categoria</p>
          </div>
          <Button onClick={() => setOpenCreate(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Categoria
          </Button>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-16" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : !categories || categories.length === 0 ? (
          <div className="flex h-48 items-center justify-center rounded-xl border border-white/10 bg-white/5">
            <p className="text-zinc-500">Nenhuma categoria cadastrada ainda.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((cat) => (
              <CategoryCard
                key={cat.id}
                category={cat}
                onEdit={() => openEdit(cat)}
                onDelete={() => handleDelete(cat.id)}
                isDeleting={deleteMutation.isPending}
              />
            ))}
          </div>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={openCreate} onOpenChange={setOpenCreate}>
        <DialogContent className="border-white/10 bg-zinc-900 text-zinc-100 sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nova Categoria</DialogTitle>
          </DialogHeader>
          <form onSubmit={onCreateSubmit} className="space-y-4">
            <CategoryFormFields form={createForm} />
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
            <DialogTitle>Editar Categoria</DialogTitle>
          </DialogHeader>
          <form onSubmit={onEditSubmit} className="space-y-4">
            <CategoryFormFields form={editForm} />
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

function CategoryCard({
  category,
  onEdit,
  onDelete,
  isDeleting,
}: {
  category: Category
  onEdit: () => void
  onDelete: () => void
  isDeleting: boolean
}) {
  return (
    <div className="group relative rounded-xl border border-white/10 bg-white/5 p-4 transition-colors hover:bg-white/8">
      <div className="flex items-start gap-3">
        {/* Color dot + icon */}
        <div
          className="flex h-10 w-10 items-center justify-center rounded-full text-lg"
          style={{ backgroundColor: category.color ? `${category.color}33` : "#10b98133" }}
        >
          {category.icon ? (
            <span>{category.icon}</span>
          ) : (
            <span
              className="h-4 w-4 rounded-full"
              style={{ backgroundColor: category.color ?? "#10b981" }}
            />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="truncate font-medium text-zinc-100">{category.name}</p>
          <div className="mt-1">
            <Badge variant={category.type === "income" ? "success" : "destructive"}>
              {category.type === "income" ? "Receita" : "Despesa"}
            </Badge>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <Button variant="ghost" className="h-8 px-2" onClick={onEdit}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            className="h-8 px-2 text-red-400 hover:bg-red-500/10 hover:text-red-400"
            onClick={onDelete}
            disabled={isDeleting}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
    </div>
  )
}

function CategoryFormFields({ form }: { form: UseFormReturn<CategoryFormData> }) {
  return (
    <>
      <div className="space-y-1.5">
        <Label>Nome</Label>
        <Input
          {...form.register("name")}
          placeholder="Ex: Alimentação, Salário..."
          className="border-white/10 bg-white/5 text-zinc-100 placeholder:text-zinc-500"
        />
        {form.formState.errors.name && (
          <p className="text-xs text-red-400">{form.formState.errors.name.message}</p>
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
        <Label>Cor</Label>
        <div className="flex items-center gap-3">
          <Controller
            control={form.control}
            name="color"
            render={({ field }) => (
              <input
                type="color"
                value={field.value ?? "#10b981"}
                onChange={(e) => field.onChange(e.target.value)}
                className="h-11 w-16 cursor-pointer rounded-xl border border-white/10 bg-white/5 p-1"
              />
            )}
          />
          <Controller
            control={form.control}
            name="color"
            render={({ field }) => (
              <Input
                value={field.value ?? "#10b981"}
                onChange={(e) => field.onChange(e.target.value)}
                placeholder="#10b981"
                className="border-white/10 bg-white/5 text-zinc-100 placeholder:text-zinc-500"
              />
            )}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label>Ícone (opcional)</Label>
        <Input
          {...form.register("icon")}
          placeholder="Ex: 🍔, 💰, ..."
          className="border-white/10 bg-white/5 text-zinc-100 placeholder:text-zinc-500"
        />
      </div>
    </>
  )
}
