import type { AgentContext, AgentInsight } from './agent-types';

export function savingsAdvisorAgent(ctx: AgentContext): AgentInsight[] {
  const insights: AgentInsight[] = [];
  const { financialSummary: s } = ctx;

  if (s.totalIncome <= 0) return insights;

  const savingsRate = s.balance / s.totalIncome;

  if (savingsRate < 0) {
    insights.push({
      id: 'sa-negative-savings',
      agent: 'savings-advisor',
      type: 'negative',
      priority: 8,
      title: 'Saldo negativo no período',
      message: `Você gastou R$ ${Math.abs(s.balance).toLocaleString('pt-BR', { minimumFractionDigits: 2 })} a mais do que recebeu. Corte gastos não essenciais.`,
    });
  } else if (savingsRate < 0.1) {
    insights.push({
      id: 'sa-low-savings',
      agent: 'savings-advisor',
      type: 'warning',
      priority: 22,
      title: 'Taxa de economia muito baixa',
      message: `Você está economizando apenas ${(savingsRate * 100).toFixed(1)}% da renda. O ideal é poupar pelo menos 20%.`,
      actionLabel: 'Ver economias',
      actionHref: '/savings',
    });
  } else if (savingsRate >= 0.2 && savingsRate < 0.3) {
    insights.push({
      id: 'sa-good-savings',
      agent: 'savings-advisor',
      type: 'positive',
      priority: 55,
      title: 'Boa taxa de economia',
      message: `Você economizou ${(savingsRate * 100).toFixed(1)}% da renda. Considere investir o excedente.`,
      actionLabel: 'Ver investimentos',
      actionHref: '/investments',
    });
  } else if (savingsRate >= 0.3) {
    insights.push({
      id: 'sa-excellent-savings',
      agent: 'savings-advisor',
      type: 'positive',
      priority: 45,
      title: 'Taxa de economia excelente!',
      message: `${(savingsRate * 100).toFixed(1)}% da renda economizada. Você está no caminho certo para a independência financeira.`,
    });
  }

  return insights;
}
