import type { AgentContext, AgentInsight } from './agent-types';

export function spendingPatternAgent(ctx: AgentContext): AgentInsight[] {
  const insights: AgentInsight[] = [];
  const { transactions, categories, financialSummary: s } = ctx;

  const expensesByCategory: Record<string, { amount: number; name: string }> = {};
  for (const t of transactions) {
    if (t.type === 'expense' && t.status !== 'cancelled' && t.category_id) {
      if (!expensesByCategory[t.category_id]) {
        const cat = categories.find(c => c.id === t.category_id);
        expensesByCategory[t.category_id] = { amount: 0, name: cat?.name ?? 'Sem nome' };
      }
      expensesByCategory[t.category_id].amount += t.amount;
    }
  }

  const sorted = Object.entries(expensesByCategory).sort((a, b) => b[1].amount - a[1].amount);

  if (sorted.length > 0 && s.totalExpenses > 0) {
    const [topId, top] = sorted[0];
    const pct = ((top.amount / s.totalExpenses) * 100).toFixed(0);
    if (parseFloat(pct) >= 50) {
      insights.push({
        id: 'sp-dominant-category',
        agent: 'spending-pattern',
        type: 'warning',
        priority: 25,
        title: 'Categoria dominante nos gastos',
        message: `"${top.name}" representa ${pct}% das suas despesas. Considere se há espaço para redução.`,
        metadata: { categoryId: topId, amount: top.amount, percentage: pct },
      });
    }

    if (sorted.length >= 3) {
      const top3Total = sorted.slice(0, 3).reduce((s, [, v]) => s + v.amount, 0);
      const top3Pct = ((top3Total / s.totalExpenses) * 100).toFixed(0);
      insights.push({
        id: 'sp-top3-categories',
        agent: 'spending-pattern',
        type: 'neutral',
        priority: 65,
        title: 'Top 3 categorias de gastos',
        message: `${sorted.slice(0, 3).map(([, v]) => v.name).join(', ')} representam ${top3Pct}% dos seus gastos no período.`,
      });
    }
  }

  const highValueExpenses = transactions.filter(t => t.type === 'expense' && t.amount > 1000);
  if (highValueExpenses.length > 0) {
    const total = highValueExpenses.reduce((s, t) => s + t.amount, 0);
    insights.push({
      id: 'sp-high-value',
      agent: 'spending-pattern',
      type: 'neutral',
      priority: 55,
      title: `${highValueExpenses.length} despesa(s) acima de R$ 1.000`,
      message: `Total de R$ ${total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} em gastos de alto valor.`,
    });
  }

  return insights;
}
