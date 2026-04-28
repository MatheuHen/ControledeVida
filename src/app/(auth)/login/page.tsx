"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion } from "framer-motion";
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
import { useLogin } from "@/hooks/useLogin";

const loginSchema = z.object({
  email: z.string().email("Digite um e-mail válido."),
  password: z
    .string()
    .min(6, "A senha precisa ter pelo menos 6 caracteres."),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const login = useLogin();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    await login.mutateAsync(values);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
    <Card className="overflow-hidden border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl">
      <CardHeader>
        <div className="inline-flex w-fit rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-300">
          Acesse sua conta
        </div>
        <CardTitle>Entrar no AppControleDeVidaXen</CardTitle>
        <CardDescription>
          Gerencie sua vida financeira com segurança e sincronização via
          Supabase.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
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
              autoComplete="current-password"
              placeholder="Digite sua senha"
              {...register("password")}
            />
            {errors.password ? (
              <p className="text-sm text-rose-400">{errors.password.message}</p>
            ) : null}
          </div>

          {login.error ? (
            <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
              {login.error.message}
            </div>
          ) : null}

          <Button className="w-full" type="submit" disabled={login.isPending}>
            {login.isPending ? "Entrando..." : "Entrar"}
          </Button>

          <p className="text-center text-sm text-zinc-400">
            Ainda não tem conta?{" "}
            <Link
              href="/register"
              className="font-medium text-emerald-300 transition hover:text-emerald-200"
            >
              Criar conta
            </Link>
          </p>
        </form>
      </CardContent>
    </Card>
    </motion.div>
  );
}