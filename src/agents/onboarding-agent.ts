import type { AgentContext, AgentInsight } from './agent-types';

export function onboardingAgent(ctx: AgentContext): AgentInsight[] {
  const insights: AgentInsight[] = [];
  const { transactions, categories, goals, reserveEntries, investmentEntries, profile } = ctx;

  const steps: Array<{ done: boolean; id: string; title: string; message: string; href: string }> = [
    {
      done: Boolean(profile?.full_name),
      id: 'ob-profile',
      title: 'Complete seu perfil',
      message: 'Adicione seu nome e configure seu valor por hora para personalizar a experiência.',
      href: '/settings',
    },
    {
      done: categories.length > 0,
      id: 'ob-categories',
      title: 'Crie suas categorias',
      message: 'Categorias ajudam a organizar seus gastos e receitas.',
      href: '/categories',
    },
    {
      done: transactions.length > 0,
      id: 'ob-transactions',
      title: 'Registre sua primeira transação',
      message: 'Comece registrando uma receita ou despesa para ter insights financeiros.',
      href: '/finances',
    },
    {
      done: goals.length > 0,
      id: 'ob-goals',
      title: 'Defina uma meta financeira',
      message: 'Metas te ajudam a manter o foco no que realmente importa.',
      href: '/goals',
    },
    {
      done: reserveEntries.length > 0,
      id: 'ob-reserve',
      title: 'Inicie sua reserva de emergência',
      message: 'Uma reserva protege você de imprevistos financeiros.',
      href: '/emergency',
    },
  ];

  const incomplete = steps.filter(s => !s.done);
  if (incomplete.length === 0) return insights;

  const next = incomplete[0];
  insights.push({
    id: next.id,
    agent: 'onboarding',
    type: 'neutral',
    priority: 85,
    title: next.title,
    message: next.message,
    actionLabel: 'Fazer agora',
    actionHref: next.href,
    metadata: { stepsRemaining: incomplete.length },
  });

  return insights;
}
