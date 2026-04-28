import type { AgentContext, AgentInsight } from './agent-types';
import { differenceInDays } from 'date-fns';

export function notificationAgent(ctx: AgentContext): AgentInsight[] {
  const insights: AgentInsight[] = [];
  const { transactions } = ctx;

  const today = new Date();
  const upcoming = transactions.filter(t => {
    if (t.status !== 'pending' || t.type !== 'expense') return false;
    const due = new Date(t.due_date);
    const diff = differenceInDays(due, today);
    return diff >= 0 && diff <= 7;
  });

  if (upcoming.length > 0) {
    const total = upcoming.reduce((s, t) => s + t.amount, 0);
    insights.push({
      id: 'notif-upcoming-due',
      agent: 'notification',
      type: 'warning',
      priority: 5,
      title: `${upcoming.length} vencimento(s) nos próximos 7 dias`,
      message: `Total de R$ ${total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} vencendo em breve. Não se esqueça de pagar!`,
      actionLabel: 'Ver pendências',
      actionHref: '/finances',
      metadata: { count: upcoming.length, total },
    });
  }

  const late = transactions.filter(t => t.status === 'late');
  if (late.length > 0) {
    const total = late.reduce((s, t) => s + t.amount, 0);
    insights.push({
      id: 'notif-late',
      agent: 'notification',
      type: 'negative',
      priority: 3,
      title: `${late.length} conta(s) em atraso!`,
      message: `Você tem R$ ${total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} em despesas atrasadas. Regularize o quanto antes.`,
      actionLabel: 'Ver atrasadas',
      actionHref: '/finances',
    });
  }

  return insights;
}
