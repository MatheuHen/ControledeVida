export type AgentInsightType = 'positive' | 'warning' | 'negative' | 'neutral';

export type AgentInsight = {
  id: string;
  agent: string;
  type: AgentInsightType;
  priority: number;
  title: string;
  message: string;
  actionLabel?: string;
  actionHref?: string;
  metadata?: Record<string, unknown>;
};

export type AgentContext = {
  userId: string;
  viewingMode: 'own' | 'shared';
  permissions: string[];
  period: { from: Date; to: Date };
  transactions: import('@/services/transactions.service').FinancialTransaction[];
  categories: import('@/services/categories.service').Category[];
  goals: import('@/services/goals.service').Goal[];
  reserveEntries: import('@/services/reserve-entries.service').ReserveEntry[];
  investmentEntries: import('@/services/investment-entries.service').InvestmentEntry[];
  profile: import('@/services/auth.service').Profile | null;
  financialSummary: { totalIncome: number; totalExpenses: number; balance: number };
};
