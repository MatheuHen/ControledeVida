import type { AgentContext, AgentInsight } from './agent-types';

const KEYWORD_CATEGORY_MAP: Record<string, string> = {
  'uber': 'Transporte', 'ônibus': 'Transporte', 'onibus': 'Transporte', 'gasolina': 'Transporte',
  'ifood': 'Alimentação', 'restaurante': 'Alimentação', 'supermercado': 'Alimentação', 'mercado': 'Alimentação',
  'farmácia': 'Saúde', 'remédio': 'Saúde', 'médico': 'Saúde', 'hospital': 'Saúde',
  'aluguel': 'Moradia', 'condomínio': 'Moradia', 'energia': 'Moradia', 'internet': 'Moradia',
  'netflix': 'Lazer', 'spotify': 'Lazer', 'cinema': 'Lazer',
  'curso': 'Educação', 'faculdade': 'Educação', 'escola': 'Educação',
};

export function transactionClassificationAgent(ctx: AgentContext): AgentInsight[] {
  const insights: AgentInsight[] = [];
  const { transactions, categories } = ctx;

  const uncategorized = transactions.filter(t => !t.category_id && t.type === 'expense');
  if (uncategorized.length >= 3) {
    insights.push({
      id: 'tc-uncategorized',
      agent: 'transaction-classification',
      type: 'neutral',
      priority: 60,
      title: `${uncategorized.length} transações sem categoria`,
      message: 'Categorizar transações melhora seus relatórios e insights financeiros.',
      actionLabel: 'Gerenciar categorias',
      actionHref: '/categories',
    });
  }

  const categoryNames = categories.map(c => c.name.toLowerCase());
  let suggestionsCount = 0;
  for (const t of uncategorized) {
    const desc = t.description.toLowerCase();
    for (const [keyword, catName] of Object.entries(KEYWORD_CATEGORY_MAP)) {
      if (desc.includes(keyword) && categoryNames.includes(catName.toLowerCase())) {
        suggestionsCount++;
        break;
      }
    }
  }

  if (suggestionsCount > 0) {
    insights.push({
      id: 'tc-suggestions',
      agent: 'transaction-classification',
      type: 'neutral',
      priority: 70,
      title: `${suggestionsCount} categorias sugeridas automaticamente`,
      message: 'O sistema identificou categorias prováveis para algumas transações sem classificação.',
      actionLabel: 'Ver transações',
      actionHref: '/finances',
    });
  }

  return insights;
}
