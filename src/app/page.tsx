"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useProfile } from "@/hooks/useProfile";
import { useSession } from "@/hooks/useSession";

export default function Home() {
  const { data: session } = useSession();
  const { data: profile, isLoading: isProfileLoading } = useProfile();
  const displayName = profile?.full_name || session?.user.email || "Usuário";

  return (
    <div className="space-y-6">
      <Card className="border-border bg-panel shadow-xl shadow-black/10">
        <CardHeader>
          <span className="inline-flex w-fit rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-sm font-medium text-emerald-500">
            Sessão autenticada
          </span>
          <CardTitle className="text-foreground">Olá, {displayName}</CardTitle>
          <CardDescription className="max-w-2xl text-muted-foreground">
            Seu dashboard principal já está pronto dentro do novo AppShell, com
            tema persistente, navegação lateral responsiva e base preparada para
            os próximos módulos.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-border bg-background/40 p-5">
            <h2 className="font-semibold text-foreground">Usuário</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {session?.user.email ?? "Sessão indisponível"}
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-background/40 p-5">
            <h2 className="font-semibold text-foreground">Perfil</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {isProfileLoading
                ? "Carregando perfil..."
                : profile?.full_name ||
                  "Perfil carregado a partir da tabela profiles"}
            </p>
          </div>
          <div className="rounded-2xl border border-border bg-background/40 p-5">
            <h2 className="font-semibold text-foreground">Status</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Layout principal ativo com animações, dark mode e navegação entre
              áreas.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}