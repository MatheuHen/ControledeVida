'use client'

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Controller } from "react-hook-form"
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

import type { SharedAccess, SharedAccessPermission, SharedAccessStatus } from "@/services/shared.service"

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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const inviteSchema = z.object({
  target_user_email: z.string().email("E-mail inválido"),
  permission_level: z.enum(["full", "finances", "investments"] as const),
})

type InviteFormData = z.infer<typeof inviteSchema>

const permissionLabels: Record<SharedAccessPermission, string> = {
  full: "Acesso Total",
  finances: "Finanças",
  investments: "Investimentos",
}

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
  return { target_user_email: "", permission_level: "finances" }
}

export default function SharedPage() {
  const { activeUserId } = useActiveUser()
  const { data: session } = useSession()
  const userId = session?.user?.id ?? ""
  const activeId = activeUserId ?? userId

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

  const onInviteSubmit = form.handleSubmit(async (data) => {
    if (!userId) return
    try {
      await createInvite.mutateAsync({
        owner_id: userId,
        target_user_email: data.target_user_email,
        permission_level: data.permission_level,
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
    <div className="min-h-screen bg-zinc-900 p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold text-zinc-100">Compartilhamento</h1>
          <p className="mt-1 text-sm text-zinc-400">Gerencie o acesso compartilhado à sua conta</p>
        </div>

        <Tabs defaultValue="meus">
          <TabsList>
            <TabsTrigger value="meus">Meus Compartilhamentos</TabsTrigger>
            <TabsTrigger value="comigo">Compartilhado Comigo</TabsTrigger>
          </TabsList>

          {/* Meus Compartilhamentos */}
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
                      <TableHead className="text-zinc-400">Permissão</TableHead>
                      <TableHead className="text-zinc-400">Status</TableHead>
                      <TableHead className="text-right text-zinc-400">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sharesLoading ? (
                      Array.from({ length: 3 }).map((_, i) => (
                        <TableRow key={i} className="border-white/10">
                          <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                          <TableCell><Skeleton className="h-5 w-24 rounded-full" /></TableCell>
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
                            <Badge variant="outline">{permissionLabels[share.permission_level]}</Badge>
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

          {/* Compartilhado Comigo */}
          <TabsContent value="comigo">
            <div className="rounded-xl border border-white/10 bg-white/5">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10 hover:bg-transparent">
                    <TableHead className="text-zinc-400">Proprietário</TableHead>
                    <TableHead className="text-zinc-400">Permissão</TableHead>
                    <TableHead className="text-zinc-400">Status</TableHead>
                    <TableHead className="text-right text-zinc-400">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sharedLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <TableRow key={i} className="border-white/10">
                        <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                        <TableCell><Skeleton className="h-5 w-24 rounded-full" /></TableCell>
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
                          <Badge variant="outline">{permissionLabels[share.permission_level]}</Badge>
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

            <div className="space-y-1.5">
              <Label>Nível de acesso</Label>
              <Controller
                control={form.control}
                name="permission_level"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="border-white/10 bg-white/5 text-zinc-100">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full">Acesso Total</SelectItem>
                      <SelectItem value="finances">Finanças</SelectItem>
                      <SelectItem value="investments">Investimentos</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {form.formState.errors.permission_level && (
                <p className="text-xs text-red-400">{form.formState.errors.permission_level.message}</p>
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
