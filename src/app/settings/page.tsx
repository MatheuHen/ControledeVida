'use client'

import { useEffect } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useQueryClient, useMutation } from "@tanstack/react-query"

import { useActiveUser } from "@/hooks/useActiveUser"
import { useProfile } from "@/hooks/useProfile"
import { useSession } from "@/hooks/useSession"
import { profileService } from "@/services/profile.service"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { MoneyInput } from "@/components/ui/money-input"

const profileSchema = z.object({
  full_name: z.string().optional().nullable(),
  avatar_url: z.string().url("URL inválida").optional().or(z.literal("")).nullable(),
})

const hourlyRateSchema = z.object({
  hourly_rate: z.number({ error: "Digite um valor" }).positive("Valor deve ser maior que zero").nullable(),
})

type ProfileFormData = z.infer<typeof profileSchema>
type HourlyRateFormData = z.infer<typeof hourlyRateSchema>

export default function SettingsPage() {
  const { data: session } = useSession()
  const userId = session?.user?.id ?? ""
  const queryClient = useQueryClient()

  const { data: profile, isLoading } = useProfile()

  // Profile mutation
  const profileMutation = useMutation({
    mutationFn: (data: { full_name?: string | null; avatar_url?: string | null }) =>
      profileService.update(userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", userId] })
    },
  })

  // Hourly rate mutation
  const hourlyRateMutation = useMutation({
    mutationFn: (data: { hourly_rate: number | null }) =>
      profileService.update(userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", userId] })
    },
  })

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: { full_name: "", avatar_url: "" },
  })

  const hourlyRateForm = useForm<HourlyRateFormData>({
    resolver: zodResolver(hourlyRateSchema),
    defaultValues: { hourly_rate: null },
  })

  // Sync forms when profile loads
  useEffect(() => {
    if (profile) {
      profileForm.reset({
        full_name: profile.full_name ?? "",
        avatar_url: profile.avatar_url ?? "",
      })
      hourlyRateForm.reset({
        hourly_rate: profile.hourly_rate ?? null,
      })
    }
  }, [profile])

  const onProfileSubmit = profileForm.handleSubmit(async (data) => {
    try {
      await profileMutation.mutateAsync({
        full_name: data.full_name || null,
        avatar_url: data.avatar_url || null,
      })
    } catch (err) {
      console.error(err)
    }
  })

  const onHourlyRateSubmit = hourlyRateForm.handleSubmit(async (data) => {
    try {
      await hourlyRateMutation.mutateAsync({ hourly_rate: data.hourly_rate })
    } catch (err) {
      console.error(err)
    }
  })

  return (
    <div className="min-h-screen bg-zinc-900 p-6">
      <div className="mx-auto max-w-2xl space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-semibold text-zinc-100">Configurações</h1>
          <p className="mt-1 text-sm text-zinc-400">Gerencie suas informações pessoais</p>
        </div>

        {/* Profile Section */}
        <section className="rounded-xl border border-white/10 bg-white/5 p-6 space-y-5">
          <div>
            <h2 className="text-base font-semibold text-zinc-100">Perfil</h2>
            <p className="mt-0.5 text-sm text-zinc-400">Suas informações pessoais</p>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-11 w-full rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-11 w-full rounded-xl" />
              </div>
              <Skeleton className="h-11 w-28 rounded-xl" />
            </div>
          ) : (
            <form onSubmit={onProfileSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="full_name">Nome completo</Label>
                <Input
                  id="full_name"
                  {...profileForm.register("full_name")}
                  placeholder="Seu nome completo"
                  className="border-white/10 bg-white/5 text-zinc-100 placeholder:text-zinc-500"
                />
                {profileForm.formState.errors.full_name && (
                  <p className="text-xs text-red-400">{profileForm.formState.errors.full_name.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="avatar_url">URL do avatar</Label>
                <Input
                  id="avatar_url"
                  {...profileForm.register("avatar_url")}
                  placeholder="https://exemplo.com/foto.jpg"
                  className="border-white/10 bg-white/5 text-zinc-100 placeholder:text-zinc-500"
                />
                {profileForm.formState.errors.avatar_url && (
                  <p className="text-xs text-red-400">{profileForm.formState.errors.avatar_url.message}</p>
                )}
              </div>

              <div className="flex items-center gap-3">
                <Button type="submit" disabled={profileMutation.isPending}>
                  {profileMutation.isPending ? "Salvando..." : "Salvar perfil"}
                </Button>
                {profileMutation.isSuccess && (
                  <p className="text-sm text-emerald-400">Perfil atualizado com sucesso!</p>
                )}
                {profileMutation.isError && (
                  <p className="text-sm text-red-400">Erro ao salvar. Tente novamente.</p>
                )}
              </div>
            </form>
          )}
        </section>

        {/* Hourly Rate Section */}
        <section className="rounded-xl border border-white/10 bg-white/5 p-6 space-y-5">
          <div>
            <h2 className="text-base font-semibold text-zinc-100">Valor por Hora</h2>
            <p className="mt-0.5 text-sm text-zinc-400">
              Usado para calcular quantas horas de vida você gasta com seus gastos
            </p>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-11 w-full rounded-xl" />
              </div>
              <Skeleton className="h-11 w-36 rounded-xl" />
            </div>
          ) : (
            <form onSubmit={onHourlyRateSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Valor por hora (R$)</Label>
                <Controller
                  control={hourlyRateForm.control}
                  name="hourly_rate"
                  render={({ field }) => (
                    <MoneyInput
                      value={field.value}
                      onChange={(v) => field.onChange(v)}
                      placeholder="R$ 0,00"
                    />
                  )}
                />
                {hourlyRateForm.formState.errors.hourly_rate && (
                  <p className="text-xs text-red-400">{hourlyRateForm.formState.errors.hourly_rate.message}</p>
                )}
                <p className="text-xs text-zinc-500">
                  Exemplo: se você ganha R$ 50/hora, insira R$ 50,00
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Button type="submit" disabled={hourlyRateMutation.isPending}>
                  {hourlyRateMutation.isPending ? "Salvando..." : "Salvar valor por hora"}
                </Button>
                {hourlyRateMutation.isSuccess && (
                  <p className="text-sm text-emerald-400">Valor atualizado com sucesso!</p>
                )}
                {hourlyRateMutation.isError && (
                  <p className="text-sm text-red-400">Erro ao salvar. Tente novamente.</p>
                )}
              </div>
            </form>
          )}
        </section>
      </div>
    </div>
  )
}
