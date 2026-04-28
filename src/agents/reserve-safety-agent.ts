import type { AgentContext, AgentInsight } from './agent-types';

export function reserveSafetyAgent(ctx: AgentContext): AgentInsight[] {
  const insights: AgentInsight[] = [];
  const { reserveEntries, financialSummary: s, profile } = ctx;

  const totalReserve = reserveEntries.reduce((sum, e) => {
    return sum + (e.type === 'deposit' ? e.amount : -e.amount);
  }, 0);

  if (totalReserve <= 0) {
    insights.push({
      id: 'rs-no-reserve',
      agent: 'reserve-safety',
      type: 'warning',
      priority: 18,
      title: 'Sem reserva de emergência',
      message: 'Você não tem reserva de emergência. Comece com pelo menos 3 meses de despesas guardados.',
      actionLabel: 'Criar reserva',
      actionHref: '/emergency',
    });
    return insights;
  }

  const monthlyExpenses = s.totalExpenses;
  if (monthlyExpenses > 0) {
    const monthsCovered = totalReserve / monthlyExpenses;
    if (monthsCovered < 3) {
      insights.push({
        id: 'rs-low-reserve',
        agent: 'reserve-safety',
        type: 'warning',
        priority: 20,
        title: 'Reserva de emergência insuficiente',
        message: `Sua reserva cobre apenas ${monthsCovered.toFixed(1)} meses de despesas. O recomendado é 3-6 meses.`,
        actionLabel: 'Reforçar reserva',
        actionHref: '/emergency',
        metadata: { totalReserve, monthsCovered },
      });
    } else if (monthsCovered >= 6) {
      insights.push({
        id: 'rs-strong-reserve',
        agent: 'reserve-safety',
        type: 'positive',
        priority: 60,
        title: 'Reserva de emergência sólida',
        message: `Sua reserva cobre ${monthsCovered.toFixed(1)} meses de despesas. Você está bem protegido!`,
        metadata: { totalReserve, monthsCovered },
      });
    }

    if (profile?.hourly_rate && profile.hourly_rate > 0) {
      const hoursProtected = totalReserve / profile.hourly_rate;
      insights.push({
        id: 'rs-life-hours',
        agent: 'reserve-safety',
        type: 'neutral',
        priority: 75,
        title: 'Proteção em horas de vida',
        message: `Sua reserva equivale a ${hoursProtected.toFixed(0)} horas de trabalho ou ${(hoursProtected / 8).toFixed(0)} dias úteis.`,
        metadata: { hoursProtected },
      });
    }
  }

  return insights;
}
