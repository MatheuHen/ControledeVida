import {
  BarChart3,
  Clock,
  Globe,
  LayoutDashboard,
  PiggyBank,
  Settings,
  Shield,
  Tags,
  Target,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";

export const APP_NAME = "VidaXen";

export const appRoutes = [
  {
    href: "/",
    title: "Dashboard",
    description: "Resumo rápido da sua vida financeira e do tempo investido.",
    icon: LayoutDashboard,
  },
  {
    href: "/global",
    title: "Visão Global",
    description: "Panorama consolidado dos seus números e indicadores principais.",
    icon: Globe,
  },
  {
    href: "/finances",
    title: "Finanças",
    description: "Acompanhe entradas, saídas e saúde financeira do período.",
    icon: Wallet,
  },
  {
    href: "/categories",
    title: "Categorias",
    description: "Organize e revise como seus gastos estão distribuídos.",
    icon: Tags,
  },
  {
    href: "/goals",
    title: "Metas",
    description: "Defina objetivos e acompanhe o avanço do seu planejamento.",
    icon: Target,
  },
  {
    href: "/savings",
    title: "Economias",
    description: "Veja sua evolução de poupança e ganhos de consistência.",
    icon: PiggyBank,
  },
  {
    href: "/emergency",
    title: "Reserva",
    description: "Monitore sua reserva de emergência e cobertura de meses.",
    icon: Shield,
  },
  {
    href: "/investments",
    title: "Investimentos",
    description: "Acompanhe crescimento patrimonial e estratégia de longo prazo.",
    icon: TrendingUp,
  },
  {
    href: "/life-cost",
    title: "Horas de Vida",
    description: "Converta gastos em horas de trabalho e custo de tempo.",
    icon: Clock,
  },
  {
    href: "/analytics",
    title: "Análises",
    description: "Explore tendências, comparativos e sinais do seu comportamento.",
    icon: BarChart3,
  },
  {
    href: "/shared",
    title: "Compartilhamento",
    description: "Gerencie contextos compartilhados e dados colaborativos.",
    icon: Users,
  },
  {
    href: "/settings",
    title: "Configurações",
    description: "Ajuste preferências, conta e comportamento do aplicativo.",
    icon: Settings,
  },
] as const;

export const publicRoutes = new Set(["/login", "/register"]);

export function getRouteMeta(pathname: string) {
  return (
    appRoutes.find((route) => route.href === pathname) ?? {
      title: "AppControleDeVidaXen",
      description: "Gerencie finanças, metas e tempo com clareza.",
      icon: LayoutDashboard,
      href: pathname,
    }
  );
}