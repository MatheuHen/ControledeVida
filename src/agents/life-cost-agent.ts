import type { AgentContext, AgentInsight } from './agent-types';

export function lifeCostAgent(ctx: AgentContext): AgentInsight[] {
  const insights: AgentInsight[] = [];
  const { profile, financialSummary: s, transactions, categories } = ctx;

  if (!profile?.hourly_rate || profile.hourly_rate <= 0) {
    insights.push({
      id: 'lc-no-rate',
      agent: 'life-cost',
      type: 'neutral',
      priority: 70,
      title: 'Configure seu valor por hora',
      message: 'Defina seu valor por hora nas configurações para ver quantas horas de vida você troca por cada gasto.',
      actionLabel: 'Configurar',
      actionHref: '/settings',
    });
    return insights;
  }

  const rate = profile.hourly_rate;
  const hoursSpent = s.totalExpenses / rate;

  if (hoursSpent >= 8) {
    insights.push({
      id: 'lc-total-hours',
      agent: 'life-cost',
      type: 'neutral',
      priority: 65,
      title: `${hoursSpent.toFixed(0)} horas de vida gastas`,
      message: `Você trocou ${hoursSpent.toFixed(0)} horas de trabalho (${(hoursSpent / 8).toFixed(1)} dias) pelas suas despesas neste período.`,
      actionLabel: 'Ver detalhes',
      actionHref: '/life-cost',
    });
  }

  // Find most expensive category in life hours
  const expensesByCategory: Record<string, { amount: number; name: string }> = {};
  for (const t of transactions) {
    if (t.type === 'expense' && t.status !== 'cancelled' && t.category_id) {
      if (!expensesByCategory[t.category_id]) {
        const cat = categories.find(c => c.id === t.category_id);
        expensesByCategory[t.category_id] = { amount: 0, name: cat?.name ?? 'Sem categoria' };
      }
      expensesByCategory[t.category_id].amount += t.amount;
    }
  }

  const sorted = Object.values(expensesByCategory).sort((a, b) => b.amount - a.amount);
  if (sorted.length > 0) {
    const top = sorted[0];
    const catHours = top.amount / rate;
    if (catHours >= 4) {
      insights.push({
        id: 'lc-top-category-hours',
        agent: 'life-cost',
        type: 'neutral',
        priority: 72,
        title: `"${top.name}" custou ${catHours.toFixed(1)} horas`,
        message: `Esta categoria consumiu mais horas de vida (${catHours.toFixed(1)}h). Vale refletir sobre esse gasto.`,
        actionLabel: 'Ver custos',
        actionHref: '/life-cost',
      });
    }
  }

  return insights;
}
