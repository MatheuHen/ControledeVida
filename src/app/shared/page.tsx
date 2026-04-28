'use client'

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { UserPlus } from "lucide-react"

import { useActiveUser } from "@/hooks/useActiveUser"
import {
  useMyShares,
  useSharedWithMe,
  useCreateInvite,
  useAcceptInvite,
  useRevokeAccess,
} from "@/hooks/useShared"
import { useSession } from "@/hooks/useSession"

import type { SharedAccess, SharedAccessStatus } from "@/services/shared.service"

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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const MODULE_OPTIONS = [
  { id: "dashboard", label: "Dashboard" },
  { id: "finances", label: "Finanças" },
  { id: "categories", label: "Categorias" },
  { id: "goals", label: "Metas" },
  { id: "savings", label: "Economias" },
  { id: "emergency", label: "Reserva" },
  { id: "investments", label: "Investimentos" },
  { id: "life-cost", label: "Horas de Vida" },
  { id: "analytics", label: "Análises" },
] as const

const inviteSchema = z.object({
  target_user_email: z.string().email("E-mail inválido"),
  permissions: z.array(z.string()).min(1, "Selecione ao menos uma permissão"),
})

type InviteFormData = z.infer<typeof inviteSchema>

const statusBadgeVariant: Record<SharedAccessStatus, "warning" | "success" | "secondary"> = {
  pending: "warning",
  accepted: "success",
  revoked: "secondary",
}

const statusLabels: Record<SharedAccessStatus, string> = {
  pending: "Pendente",
  accepted: "Aceito",
  revoked: "Revogado",
}

function defaultValues(): InviteFormData {
  return { target_user_email: "", permissions: ["dashboard"] }
}

function PermissionBadges({ permissions }: { permissions: string[] }) {
  const labels: Record<string, string> = {
    dashboard: "Dashboard",
    finances: "Finanças",
    categories: "Categorias",
    goals: "Metas",
    savings: "Economias",
    emergency: "Reserva",
    investments: "Investimentos",
    "life-cost": "Horas de Vida",
    analytics: "Análises",
  }
  if (!permissions || permissions.length === 0) return <span className="text-zinc-500 text-xs">Sem permissões</span>
  return (
    <div className="flex flex-wrap gap-1">
      {permissions.map((p) => (
        <Badge key={p} variant="outline" className="text-xs">
          {labels[p] ?? p}
        </Badge>
      ))}
    </div>
  )
}

export default function SharedPage() {
  const { activeUserId } = useActiveUser()
  const { data: session } = useSession()
  const userId = session?.user?.id ?? ""

  const [openInvite, setOpenInvite] = useState(false)

  const { data: myShares, isLoading: sharesLoading } = useMyShares(userId)
  const { data: sharedWithMe, isLoading: sharedLoading } = useSharedWithMe(userId)
  const createInvite = useCreateInvite(userId)
  const acceptInvite = useAcceptInvite(userId)
  const revokeAccess = useRevokeAccess(userId)

  const form = useForm<InviteFormData>({
    resolver: zodResolver(inviteSchema),
    defaultValues: defaultValues(),
  })

  const watchedPermissions = form.watch("permissions")

  function togglePermission(id: string) {
    const current = form.getValues("permissions")
    if (current.includes(id)) {
      form.setValue("permissions", current.filter((p) => p !== id), { shouldValidate: true })
    } else {
      form.setValue("permissions", [...current, id], { shouldValidate: true })
    }
  }

  function selectAll() {
    form.setValue("permissions", MODULE_OPTIONS.map((m) => m.id), { shouldValidate: true })
  }

  function clearAll() {
    form.setValue("permissions", [], { shouldValidate: true })
  }

  const onInviteSubmit = form.handleSubmit(async (data) => {
    if (!userId) return
    try {
      await createInvite.mutateAsync({
        owner_id: userId,
        target_user_email: data.target_user_email,
        permissions: data.permissions,
      })
      setOpenInvite(false)
      form.reset(defaultValues())
    } catch (err) {
      console.error(err)
    }
  })

  async function handleRevoke(id: string) {
    try {
      await revokeAccess.mutateAsync(id)
    } catch (err) {
      console.error(err)
    }
  }

  async function handleAccept(id: string) {
    try {
      await acceptInvite.mutateAsync(id)
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Compartilhamento</h1>
          <p className="mt-1 text-sm text-muted-foreground">Gerencie o acesso compartilhado à sua conta</p>
        </div>

        <Tabs defaultValue="meus">
          <TabsList>
            <TabsTrigger value="meus">Meus Compartilhamentos</TabsTrigger>
            <TabsTrigger value="comigo">Compartilhado Comigo</TabsTrigger>
          </TabsList>

          <TabsContent value="meus">
            <div className="space-y-4">
              <div className="flex justify-end">
                <Button onClick={() => setOpenInvite(true)}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Convidar
                </Button>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5">
                <Table>
                  <TableHeader>
                    <TableRow className="border-white/10 hover:bg-transparent">
                      <TableHead className="text-zinc-400">E-mail</TableHead>
                      <TableHead className="text-zinc-400">Permissões</TableHead>
                      <TableHead className="text-zinc-400">Status</TableHead>
                      <TableHead className="text-right text-zinc-400">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sharesLoading ? (
                      Array.from({ length: 3 }).map((_, i) => (
                        <TableRow key={i} className="border-white/10">
                          <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                          <TableCell><Skeleton className="h-5 w-48 rounded-full" /></TableCell>
                          <TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
                          <TableCell><Skeleton className="ml-auto h-9 w-20" /></TableCell>
                        </TableRow>
                      ))
                    ) : !myShares || myShares.length === 0 ? (
                      <TableRow className="border-white/10">
                        <TableCell colSpan={4} className="py-12 text-center text-zinc-500">
                          Você não convidou ninguém ainda.
                        </TableCell>
                      </TableRow>
                    ) : (
                      myShares.map((share) => (
                        <TableRow key={share.id} className="border-white/10 hover:bg-white/5">
                          <TableCell className="text-zinc-100">{share.target_user_email}</TableCell>
                          <TableCell>
                            <PermissionBadges permissions={Array.isArray(share.permissions) ? share.permissions : []} />
                          </TableCell>
                          <TableCell>
                            <Badge variant={statusBadgeVariant[share.status]}>
                              {statusLabels[share.status]}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {share.status !== "revoked" && (
                              <Button
                                variant="destructive"
                                className="h-8 px-3 text-xs"
                                onClick={() => handleRevoke(share.id)}
                                disabled={revokeAccess.isPending}
                              >
                                Revogar
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="comigo">
            <div className="rounded-xl border border-white/10 bg-white/5">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10 hover:bg-transparent">
                    <TableHead className="text-zinc-400">Proprietário</TableHead>
                    <TableHead className="text-zinc-400">Permissões</TableHead>
                    <TableHead className="text-zinc-400">Status</TableHead>
                    <TableHead className="text-right text-zinc-400">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sharedLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <TableRow key={i} className="border-white/10">
                        <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-48 rounded-full" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-20 rounded-full" /></TableCell>
                        <TableCell><Skeleton className="ml-auto h-9 w-20" /></TableCell>
                      </TableRow>
                    ))
                  ) : !sharedWithMe || sharedWithMe.length === 0 ? (
                    <TableRow className="border-white/10">
                      <TableCell colSpan={4} className="py-12 text-center text-zinc-500">
                        Nenhum compartilhamento recebido ainda.
                      </TableCell>
                    </TableRow>
                  ) : (
                    sharedWithMe.map((share) => (
                      <TableRow key={share.id} className="border-white/10 hover:bg-white/5">
                        <TableCell className="text-zinc-100">{share.target_user_email}</TableCell>
                        <TableCell>
                          <PermissionBadges permissions={Array.isArray(share.permissions) ? share.permissions : []} />
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusBadgeVariant[share.status]}>
                            {statusLabels[share.status]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {share.status === "pending" && (
                            <Button
                              className="h-8 px-3 text-xs"
                              onClick={() => handleAccept(share.id)}
                              disabled={acceptInvite.isPending}
                            >
                              Aceitar
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Invite Dialog */}
      <Dialog open={openInvite} onOpenChange={setOpenInvite}>
        <DialogContent className="border-white/10 bg-zinc-900 text-zinc-100 sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Convidar Usuário</DialogTitle>
          </DialogHeader>
          <form onSubmit={onInviteSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>E-mail</Label>
              <Input
                {...form.register("target_user_email")}
                type="email"
                placeholder="email@exemplo.com"
                className="border-white/10 bg-white/5 text-zinc-100 placeholder:text-zinc-500"
              />
              {form.formState.errors.target_user_email && (
                <p className="text-xs text-red-400">{form.formState.errors.target_user_email.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Módulos com acesso</Label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={selectAll}
                    className="text-xs text-emerald-400 hover:underline"
                  >
                    Selecionar todos
                  </button>
                  <span className="text-zinc-600">·</span>
                  <button
                    type="button"
                    onClick={clearAll}
                    className="text-xs text-zinc-400 hover:underline"
                  >
                    Limpar
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {MODULE_OPTIONS.map((mod) => {
                  const checked = watchedPermissions.includes(mod.id)
                  return (
                    <label
                      key={mod.id}
                      className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                        checked
                          ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-300"
                          : "border-white/10 bg-white/5 text-zinc-400 hover:bg-white/8"
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={checked}
                        onChange={() => togglePermission(mod.id)}
                      />
                      <span className={`h-3.5 w-3.5 rounded border flex items-center justify-center ${
                        checked ? "border-emerald-500 bg-emerald-500" : "border-zinc-600"
                      }`}>
                        {checked && (
                          <svg className="h-2.5 w-2.5 text-white" fill="none" viewBox="0 0 12 12">
                            <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </span>
                      {mod.label}
                    </label>
                  )
                })}
              </div>
              {form.formState.errors.permissions && (
                <p className="text-xs text-red-400">{form.formState.errors.permissions.message}</p>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setOpenInvite(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createInvite.isPending}>
                {createInvite.isPending ? "Enviando..." : "Enviar convite"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
