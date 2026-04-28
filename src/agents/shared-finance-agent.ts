import type { AgentContext, AgentInsight } from './agent-types';

export function sharedFinanceAgent(ctx: AgentContext): AgentInsight[] {
  const insights: AgentInsight[] = [];

  if (ctx.viewingMode !== 'shared') return insights;

  const hasFinances = ctx.permissions.includes('finances');
  const hasInvestments = ctx.permissions.includes('investments');
  const hasGoals = ctx.permissions.includes('goals');

  insights.push({
    id: 'sf-viewing-shared',
    agent: 'shared-finance',
    type: 'neutral',
    priority: 90,
    title: 'Visualização compartilhada',
    message: `Você está visualizando dados de outro usuário. Acesso: ${[
      hasFinances && 'Finanças',
      hasInvestments && 'Investimentos',
      hasGoals && 'Metas',
    ].filter(Boolean).join(', ') || 'Básico'}.`,
  });

  return insights;
}
