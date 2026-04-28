import type { AgentContext, AgentInsight } from './agent-types';

export function financialIntelligenceAgent(ctx: AgentContext): AgentInsight[] {
  const insights: AgentInsight[] = [];
  const { financialSummary: s, transactions, period } = ctx;

  if (s.totalExpenses > s.totalIncome && s.totalIncome > 0) {
    const pct = ((s.totalExpenses / s.totalIncome) * 100 - 100).toFixed(0);
    insights.push({
      id: 'fi-expenses-exceed-income',
      agent: 'financial-intelligence',
      type: 'negative',
      priority: 10,
      title: 'Gastos maiores que receitas',
      message: `Você gastou ${pct}% a mais do que recebeu neste período. Revise suas despesas urgentemente.`,
      actionLabel: 'Ver finanças',
      actionHref: '/finances',
    });
  }

  if (s.totalIncome > 0 && s.balance > s.totalIncome * 0.3) {
    const savePct = ((s.balance / s.totalIncome) * 100).toFixed(0);
    insights.push({
      id: 'fi-high-savings',
      agent: 'financial-intelligence',
      type: 'positive',
      priority: 50,
      title: 'Excelente taxa de economia',
      message: `Você economizou ${savePct}% da sua renda. Continue assim para atingir seus objetivos mais rápido!`,
    });
  }

  if (s.totalIncome === 0 && s.totalExpenses > 0) {
    insights.push({
      id: 'fi-no-income',
      agent: 'financial-intelligence',
      type: 'warning',
      priority: 15,
      title: 'Nenhuma receita registrada',
      message: 'Você tem despesas mas não registrou receitas no período. Adicione suas entradas para ter visão completa.',
      actionLabel: 'Adicionar receita',
      actionHref: '/finances',
    });
  }

  if (s.totalIncome === 0 && s.totalExpenses === 0) {
    insights.push({
      id: 'fi-empty',
      agent: 'financial-intelligence',
      type: 'neutral',
      priority: 100,
      title: 'Sem movimentações',
      message: 'Nenhuma transação encontrada neste período. Comece registrando suas receitas e despesas.',
      actionLabel: 'Adicionar transação',
      actionHref: '/finances',
    });
  }

  const pending = transactions.filter(t => t.status === 'pending' && t.type === 'expense');
  if (pending.length > 0) {
    const total = pending.reduce((s, t) => s + t.amount, 0);
    insights.push({
      id: 'fi-pending-expenses',
      agent: 'financial-intelligence',
      type: 'warning',
      priority: 20,
      title: `${pending.length} despesa(s) pendente(s)`,
      message: `Total de R$ ${total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} em despesas ainda não pagas.`,
      actionLabel: 'Ver pendências',
      actionHref: '/finances',
    });
  }

  return insights;
}
