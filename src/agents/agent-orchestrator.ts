import type { AgentContext, AgentInsight, AgentInsightType } from './agent-types';
import { financialIntelligenceAgent } from './financial-intelligence-agent';
import { transactionClassificationAgent } from './transaction-classification-agent';
import { spendingPatternAgent } from './spending-pattern-agent';
import { savingsAdvisorAgent } from './savings-advisor-agent';
import { reserveSafetyAgent } from './reserve-safety-agent';
import { investmentInsightAgent } from './investment-insight-agent';
import { goalCoachAgent } from './goal-coach-agent';
import { lifeCostAgent } from './life-cost-agent';
import { sharedFinanceAgent } from './shared-finance-agent';
import { notificationAgent } from './notification-agent';
import { onboardingAgent } from './onboarding-agent';

const TYPE_PRIORITY: Record<AgentInsightType, number> = {
  negative: 0,
  warning: 1,
  neutral: 2,
  positive: 3,
};

export function getInsights(context: AgentContext, maxInsights = 10): AgentInsight[] {
  const allAgents = [
    financialIntelligenceAgent,
    transactionClassificationAgent,
    spendingPatternAgent,
    savingsAdvisorAgent,
    reserveSafetyAgent,
    investmentInsightAgent,
    goalCoachAgent,
    lifeCostAgent,
    sharedFinanceAgent,
    notificationAgent,
    onboardingAgent,
  ];

  const rawInsights: AgentInsight[] = [];

  for (const agent of allAgents) {
    try {
      const results = agent(context);
      rawInsights.push(...results);
    } catch {
      // Fail silently per agent
    }
  }

  // Deduplicate by id
  const seen = new Set<string>();
  const unique = rawInsights.filter(i => {
    if (seen.has(i.id)) return false;
    seen.add(i.id);
    return true;
  });

  // Sort: by type first (negative < warning < neutral < positive), then by priority (lower = more urgent)
  unique.sort((a, b) => {
    const typeDiff = TYPE_PRIORITY[a.type] - TYPE_PRIORITY[b.type];
    if (typeDiff !== 0) return typeDiff;
    return a.priority - b.priority;
  });

  return unique.slice(0, maxInsights);
}
