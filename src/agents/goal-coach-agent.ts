import type { AgentContext, AgentInsight } from './agent-types';

export function goalCoachAgent(ctx: AgentContext): AgentInsight[] {
  const insights: AgentInsight[] = [];
  const { goals } = ctx;

  if (goals.length === 0) return insights;

  const activeGoals = goals.filter(g => g.status === 'active');
  const completedGoals = goals.filter(g => g.status === 'completed');
  const lateGoals = goals.filter(g => g.status === 'late' || g.status === 'failed');

  if (lateGoals.length > 0) {
    insights.push({
      id: 'gc-late-goals',
      agent: 'goal-coach',
      type: 'negative',
      priority: 12,
      title: `${lateGoals.length} meta(s) em atraso`,
      message: `Você tem metas que não foram atingidas no prazo. Revise seus objetivos ou ajuste os valores.`,
      actionLabel: 'Ver metas',
      actionHref: '/goals',
    });
  }

  if (completedGoals.length > 0) {
    insights.push({
      id: 'gc-completed-goals',
      agent: 'goal-coach',
      type: 'positive',
      priority: 55,
      title: `${completedGoals.length} meta(s) concluída(s)`,
      message: 'Parabéns! Você atingiu seus objetivos financeiros. Continue definindo novas metas!',
    });
  }

  for (const goal of activeGoals) {
    const progress = goal.target_amount > 0 ? (goal.current_amount / goal.target_amount) * 100 : 0;
    const daysToEnd = Math.ceil((new Date(goal.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

    if (daysToEnd <= 7 && progress < 80) {
      insights.push({
        id: `gc-urgent-${goal.id}`,
        agent: 'goal-coach',
        type: 'warning',
        priority: 15,
        title: `Meta "${goal.name}" vence em ${daysToEnd} dias`,
        message: `Você completou ${progress.toFixed(0)}% da meta. Ainda falta R$ ${(goal.target_amount - goal.current_amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.`,
        actionLabel: 'Ver meta',
        actionHref: '/goals',
        metadata: { goalId: goal.id, progress, daysToEnd },
      });
    } else if (progress >= 90 && progress < 100) {
      insights.push({
        id: `gc-almost-${goal.id}`,
        agent: 'goal-coach',
        type: 'positive',
        priority: 40,
        title: `Meta "${goal.name}" quase concluída!`,
        message: `Você está a ${(100 - progress).toFixed(0)}% de completar essa meta. Continue!`,
        actionLabel: 'Ver meta',
        actionHref: '/goals',
      });
    }
  }

  return insights;
}
