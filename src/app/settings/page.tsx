'use client'

import { useEffect, useState } from "react"
import { useForm, Controller } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { useQueryClient, useMutation } from "@tanstack/react-query"

import { useProfile } from "@/hooks/useProfile"
import { useSession } from "@/hooks/useSession"
import { profileService } from "@/services/profile.service"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { MoneyInput } from "@/components/ui/money-input"
import { ThemeToggle } from "@/components/ThemeToggle"

// DiceBear avatar seeds — 20 varied, illustrated avatars
const AVATAR_SEEDS = [
  "Felix", "Aneka", "Milo", "Luna", "Leo",
  "Maya", "Kai", "Nora", "Theo", "Zara",
  "Ruby", "Oscar", "Ivy", "Max", "Ella",
  "Sam", "Lily", "Jack", "Mia", "Noah",
]

function avatarUrl(seed: string) {
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf&backgroundType=circle`
}

function applyCpfMask(value: string) {
  return value
    .replace(/\D/g, "")
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/(\d{3})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3-$4")
}

function applyPhoneMask(value: string) {
  return value
    .replace(/\D/g, "")
    .slice(0, 11)
    .replace(/(\d{2})(\d)/, "($1)$2")
    .replace(/\((\d{2})\)(\d{5})(\d)/, "($1)$2-$3")
}

const profileSchema = z.object({
  full_name: z.string().optional().nullable(),
  cpf: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  avatar_preset: z.string().optional().nullable(),
  avatar_url: z.string().url("URL inválida").optional().or(z.literal("")).nullable(),
})

const hourlyRateSchema = z.object({
  mode: z.enum(["manual", "auto"]),
  hourly_rate: z.number().positive("Deve ser positivo").nullable().optional(),
  salary_monthly: z.number().positive("Deve ser positivo").nullable().optional(),
  work_hours_per_day: z.number().positive("Deve ser positivo").nullable().optional(),
  work_days_per_week: z.number().positive("Deve ser positivo").nullable().optional(),
})

type ProfileFormData = z.infer<typeof profileSchema>
type HourlyRateFormData = z.infer<typeof hourlyRateSchema>

export default function SettingsPage() {
  const { data: session } = useSession()
  const userId = session?.user?.id ?? ""
  const userEmail = session?.user?.email ?? ""
  const queryClient = useQueryClient()

  const { data: profile, isLoading } = useProfile()

  const profileMutation = useMutation({
    mutationFn: (data: Parameters<typeof profileService.update>[1]) =>
      profileService.update(userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", userId] })
    },
  })

  const hourlyRateMutation = useMutation({
    mutationFn: (data: Parameters<typeof profileService.update>[1]) =>
      profileService.update(userId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile", userId] })
    },
  })

  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: { full_name: "", cpf: "", phone: "", avatar_preset: null, avatar_url: "" },
  })

  const hourlyRateForm = useForm<HourlyRateFormData>({
    resolver: zodResolver(hourlyRateSchema),
    defaultValues: {
      mode: "manual",
      hourly_rate: null,
      salary_monthly: null,
      work_hours_per_day: 8,
      work_days_per_week: 5,
    },
  })

  const watchMode = hourlyRateForm.watch("mode")
  const watchSalary = hourlyRateForm.watch("salary_monthly")
  const watchHours = hourlyRateForm.watch("work_hours_per_day")
  const watchDays = hourlyRateForm.watch("work_days_per_week")

  const computedHourlyRate =
    watchMode === "auto" &&
    watchSalary &&
    watchHours &&
    watchDays
      ? watchSalary / (watchHours * watchDays * 4.33)
      : null

  useEffect(() => {
    if (profile) {
      profileForm.reset({
        full_name: profile.full_name ?? "",
        cpf: profile.cpf ?? "",
        phone: profile.phone ?? "",
        avatar_preset: profile.avatar_preset ?? null,
        avatar_url: profile.avatar_url ?? "",
      })
      const hasAutoFields = profile.salary_monthly || profile.work_hours_per_day || profile.work_days_per_week
      hourlyRateForm.reset({
        mode: hasAutoFields ? "auto" : "manual",
        hourly_rate: profile.hourly_rate ?? null,
        salary_monthly: profile.salary_monthly ?? null,
        work_hours_per_day: profile.work_hours_per_day ?? 8,
        work_days_per_week: profile.work_days_per_week ?? 5,
      })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile])

  const onProfileSubmit = profileForm.handleSubmit(async (data) => {
    try {
      await profileMutation.mutateAsync({
        full_name: data.full_name || null,
        cpf: data.cpf || null,
        phone: data.phone || null,
        avatar_preset: data.avatar_preset || null,
        avatar_url: data.avatar_url || null,
      })
    } catch (err) {
      console.error(err)
    }
  })

  const onHourlyRateSubmit = hourlyRateForm.handleSubmit(async (data) => {
    try {
      if (data.mode === "manual") {
        await hourlyRateMutation.mutateAsync({
          hourly_rate: data.hourly_rate ?? null,
          salary_monthly: null,
          work_hours_per_day: null,
          work_days_per_week: null,
        })
      } else {
        await hourlyRateMutation.mutateAsync({
          hourly_rate: computedHourlyRate ?? null,
          salary_monthly: data.salary_monthly ?? null,
          work_hours_per_day: data.work_hours_per_day ?? null,
          work_days_per_week: data.work_days_per_week ?? null,
        })
      }
    } catch (err) {
      console.error(err)
    }
  })

  const selectedPreset = profileForm.watch("avatar_preset")

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Configurações</h1>
        <p className="mt-1 text-sm text-muted-foreground">Gerencie suas informações pessoais</p>
      </div>

        {/* Seção 1: Perfil */}
        <section className="rounded-xl border border-border bg-card p-6 space-y-5">
          <div>
            <h2 className="text-base font-semibold text-card-foreground">Perfil</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">Suas informações pessoais</p>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-1.5">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-11 w-full rounded-xl" />
                </div>
              ))}
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
                />
              </div>

              <div className="space-y-1.5">
                <Label>E-mail</Label>
                <Input
                  value={userEmail}
                  readOnly
                  className="cursor-not-allowed opacity-60"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cpf">CPF</Label>
                <Controller
                  control={profileForm.control}
                  name="cpf"
                  render={({ field }) => (
                    <Input
                      id="cpf"
                      value={field.value ?? ""}
                      onChange={(e) => field.onChange(applyCpfMask(e.target.value))}
                      placeholder="000.000.000-00"
                    />
                  )}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="phone">Telefone</Label>
                <Controller
                  control={profileForm.control}
                  name="phone"
                  render={({ field }) => (
                    <Input
                      id="phone"
                      value={field.value ?? ""}
                      onChange={(e) => field.onChange(applyPhoneMask(e.target.value))}
                      placeholder="(00)00000-0000"
                    />
                  )}
                />
              </div>

              {/* Avatar grid — DiceBear illustrated avatars */}
              <div className="space-y-2">
                <Label>Avatar</Label>
                <div className="grid grid-cols-10 gap-2">
                  {AVATAR_SEEDS.map((seed) => (
                    <button
                      key={seed}
                      type="button"
                      title={seed}
                      onClick={() =>
                        profileForm.setValue(
                          "avatar_preset",
                          selectedPreset === seed ? null : seed,
                          { shouldDirty: true }
                        )
                      }
                      className={`relative flex h-10 w-10 items-center justify-center rounded-full overflow-hidden transition-all ${
                        selectedPreset === seed
                          ? "ring-2 ring-emerald-500 ring-offset-2 ring-offset-card"
                          : "ring-1 ring-border hover:ring-emerald-400"
                      }`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={avatarUrl(seed)}
                        alt={seed}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    </button>
                  ))}
                </div>
                {selectedPreset && (
                  <p className="text-xs text-muted-foreground">
                    Avatar selecionado: <span className="font-medium text-foreground">{selectedPreset}</span>
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="avatar_url">URL do avatar customizado (opcional)</Label>
                <Input
                  id="avatar_url"
                  {...profileForm.register("avatar_url")}
                  placeholder="https://exemplo.com/foto.jpg"
                />
                {profileForm.formState.errors.avatar_url && (
                  <p className="text-xs text-destructive">{profileForm.formState.errors.avatar_url.message}</p>
                )}
              </div>

              <div className="flex items-center gap-3">
                <Button type="submit" disabled={profileMutation.isPending}>
                  {profileMutation.isPending ? "Salvando..." : "Salvar perfil"}
                </Button>
                {profileMutation.isSuccess && (
                  <p className="text-sm text-emerald-600 dark:text-emerald-400">Perfil atualizado!</p>
                )}
                {profileMutation.isError && (
                  <p className="text-sm text-destructive">Erro ao salvar.</p>
                )}
              </div>
            </form>
          )}
        </section>

        {/* Seção 2: Valor por Hora */}
        <section className="rounded-xl border border-border bg-card p-6 space-y-5">
          <div>
            <h2 className="text-base font-semibold text-card-foreground">Valor por Hora</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Usado para calcular quantas horas de vida você gasta com seus gastos
            </p>
          </div>

          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-11 w-full rounded-xl" />
              <Skeleton className="h-11 w-36 rounded-xl" />
            </div>
          ) : (
            <form onSubmit={onHourlyRateSubmit} className="space-y-4">
              {/* Mode toggle */}
              <div className="flex gap-2">
                <Controller
                  control={hourlyRateForm.control}
                  name="mode"
                  render={({ field }) => (
                    <>
                      <button
                        type="button"
                        onClick={() => field.onChange("manual")}
                        className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                          field.value === "manual"
                            ? "bg-emerald-500 text-white"
                            : "border border-border bg-muted text-muted-foreground hover:bg-muted/80"
                        }`}
                      >
                        Manual
                      </button>
                      <button
                        type="button"
                        onClick={() => field.onChange("auto")}
                        className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                          field.value === "auto"
                            ? "bg-emerald-500 text-white"
                            : "border border-border bg-muted text-muted-foreground hover:bg-muted/80"
                        }`}
                      >
                        Automático
                      </button>
                    </>
                  )}
                />
              </div>

              {watchMode === "manual" ? (
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
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label>Salário mensal (R$)</Label>
                    <Controller
                      control={hourlyRateForm.control}
                      name="salary_monthly"
                      render={({ field }) => (
                        <MoneyInput
                          value={field.value}
                          onChange={(v) => field.onChange(v)}
                          placeholder="R$ 0,00"
                        />
                      )}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label>Horas por dia</Label>
                      <Controller
                        control={hourlyRateForm.control}
                        name="work_hours_per_day"
                        render={({ field }) => (
                          <Input
                            type="number"
                            min={1}
                            max={24}
                            step={0.5}
                            value={field.value ?? ""}
                            onChange={(e) => field.onChange(Number(e.target.value) || null)}
                          />
                        )}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label>Dias por semana</Label>
                      <Controller
                        control={hourlyRateForm.control}
                        name="work_days_per_week"
                        render={({ field }) => (
                          <Input
                            type="number"
                            min={1}
                            max={7}
                            step={1}
                            value={field.value ?? ""}
                            onChange={(e) => field.onChange(Number(e.target.value) || null)}
                          />
                        )}
                      />
                    </div>
                  </div>
                  {computedHourlyRate !== null && (
                    <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-4 py-3">
                      <p className="text-sm text-muted-foreground">Valor por hora calculado:</p>
                      <p className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">
                        R$ {computedHourlyRate.toFixed(2).replace(".", ",")}
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center gap-3">
                <Button type="submit" disabled={hourlyRateMutation.isPending}>
                  {hourlyRateMutation.isPending ? "Salvando..." : "Salvar valor por hora"}
                </Button>
                {hourlyRateMutation.isSuccess && (
                  <p className="text-sm text-emerald-600 dark:text-emerald-400">Atualizado!</p>
                )}
                {hourlyRateMutation.isError && (
                  <p className="text-sm text-destructive">Erro ao salvar.</p>
                )}
              </div>
            </form>
          )}
        </section>

        {/* Seção 3: Aparência */}
        <section className="rounded-xl border border-border bg-card p-6 space-y-5">
          <div>
            <h2 className="text-base font-semibold text-card-foreground">Aparência</h2>
            <p className="mt-0.5 text-sm text-muted-foreground">Personalize a aparência do aplicativo</p>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Tema</p>
              <p className="text-xs text-muted-foreground">Alternar entre modo claro e escuro</p>
            </div>
            <ThemeToggle />
          </div>
        </section>
    </div>
  )
}
