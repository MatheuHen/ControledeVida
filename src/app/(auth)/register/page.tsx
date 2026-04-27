"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRegister } from "@/hooks/useRegister";

const registerSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(3, "Digite seu nome completo."),
    email: z.string().email("Digite um e-mail válido."),
    password: z
      .string()
      .min(6, "A senha precisa ter pelo menos 6 caracteres."),
    confirmPassword: z.string(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    message: "As senhas não coincidem.",
    path: ["confirmPassword"],
  });

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const registerMutation = useRegister();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (values: RegisterFormValues) => {
    await registerMutation.mutateAsync({
      fullName: values.fullName,
      email: values.email,
      password: values.password,
    });
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader>
        <div className="inline-flex w-fit rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-300">
          Crie sua conta
        </div>
        <CardTitle>Comece agora</CardTitle>
        <CardDescription>
          Cadastre-se para acessar seu painel financeiro e perfil criado
          automaticamente.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
          <div className="space-y-2">
            <Label htmlFor="fullName">Nome completo</Label>
            <Input
              id="fullName"
              autoComplete="name"
              placeholder="Seu nome"
              {...register("fullName")}
            />
            {errors.fullName ? (
              <p className="text-sm text-rose-400">{errors.fullName.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="voce@email.com"
              {...register("email")}
            />
            {errors.email ? (
              <p className="text-sm text-rose-400">{errors.email.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              placeholder="Crie uma senha"
              {...register("password")}
            />
            {errors.password ? (
              <p className="text-sm text-rose-400">{errors.password.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar senha</Label>
            <Input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              placeholder="Repita a senha"
              {...register("confirmPassword")}
            />
            {errors.confirmPassword ? (
              <p className="text-sm text-rose-400">
                {errors.confirmPassword.message}
              </p>
            ) : null}
          </div>

          {registerMutation.error ? (
            <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
              {registerMutation.error.message}
            </div>
          ) : null}

          <Button
            className="w-full"
            type="submit"
            disabled={registerMutation.isPending}
          >
            {registerMutation.isPending ? "Criando conta..." : "Criar conta"}
          </Button>

          <p className="text-center text-sm text-zinc-400">
            Já possui conta?{" "}
            <Link
              href="/login"
              className="font-medium text-emerald-300 transition hover:text-emerald-200"
            >
              Fazer login
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
  );
}