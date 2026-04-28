import type { AgentContext, AgentInsight } from './agent-types';

export function investmentInsightAgent(ctx: AgentContext): AgentInsight[] {
  const insights: AgentInsight[] = [];
  const { investmentEntries } = ctx;

  if (investmentEntries.length === 0) {
    insights.push({
      id: 'ii-no-investments',
      agent: 'investment-insight',
      type: 'neutral',
      priority: 80,
      title: 'Nenhum investimento registrado',
      message: 'Comece a investir para fazer seu dinheiro trabalhar por você.',
      actionLabel: 'Adicionar investimento',
      actionHref: '/investments',
    });
    return insights;
  }

  const totalInvested = investmentEntries.reduce((s, e) => s + e.value, 0);
  const totalCurrent = investmentEntries.reduce((s, e) => s + (e.current_value ?? e.value), 0);
  const totalPL = totalCurrent - totalInvested;
  const plPct = totalInvested > 0 ? (totalPL / totalInvested) * 100 : 0;

  if (totalPL > 0) {
    insights.push({
      id: 'ii-positive-pl',
      agent: 'investment-insight',
      type: 'positive',
      priority: 50,
      title: 'Investimentos com lucro',
      message: `Seus investimentos renderam R$ ${totalPL.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (${plPct.toFixed(2)}%) até agora.`,
      metadata: { totalInvested, totalCurrent, totalPL, plPct },
    });
  } else if (totalPL < 0) {
    insights.push({
      id: 'ii-negative-pl',
      agent: 'investment-insight',
      type: 'warning',
      priority: 25,
      title: 'Investimentos com prejuízo',
      message: `Seus investimentos estão com perda de R$ ${Math.abs(totalPL).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (${Math.abs(plPct).toFixed(2)}%).`,
      actionLabel: 'Ver detalhes',
      actionHref: '/investments',
    });
  }

  // Check concentration
  const byCategory: Record<string, number> = {};
  for (const e of investmentEntries) {
    byCategory[e.category] = (byCategory[e.category] ?? 0) + (e.current_value ?? e.value);
  }
  const sortedCats = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);
  if (sortedCats.length > 0 && totalCurrent > 0) {
    const [topCat, topVal] = sortedCats[0];
    const concentration = (topVal / totalCurrent) * 100;
    if (concentration > 70) {
      insights.push({
        id: 'ii-concentration',
        agent: 'investment-insight',
        type: 'warning',
        priority: 30,
        title: 'Concentração em um ativo',
        message: `${concentration.toFixed(0)}% dos seus investimentos estão em "${topCat}". Diversificar reduz riscos.`,
      });
    }
  }

  return insights;
}
