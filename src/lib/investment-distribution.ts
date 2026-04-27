import type { InvestmentEntry } from "@/services/investment-entries.service";

export interface InvestmentDistributionItem {
  category: string;
  totalValue: number;
  totalCurrentValue: number;
  percentage: number;
  count: number;
}

export interface InvestmentDistribution {
  items: InvestmentDistributionItem[];
  totalValue: number;
  totalCurrentValue: number;
  profitLoss: number;
  profitLossPercent: number;
  topCategory: string | null;
}

export function getInvestmentDistribution(
  entries: InvestmentEntry[],
): InvestmentDistribution {
  if (entries.length === 0) {
    return {
      items: [],
      totalValue: 0,
      totalCurrentValue: 0,
      profitLoss: 0,
      profitLossPercent: 0,
      topCategory: null,
    };
  }

  const grouped: Record<string, { value: number; currentValue: number; count: number }> = {};

  for (const entry of entries) {
    if (!grouped[entry.category]) {
      grouped[entry.category] = { value: 0, currentValue: 0, count: 0 };
    }
    grouped[entry.category].value += entry.value;
    grouped[entry.category].currentValue += entry.current_value ?? entry.value;
    grouped[entry.category].count += 1;
  }

  const totalValue = Object.values(grouped).reduce((sum, g) => sum + g.value, 0);
  const totalCurrentValue = Object.values(grouped).reduce((sum, g) => sum + g.currentValue, 0);

  const items: InvestmentDistributionItem[] = Object.entries(grouped)
    .map(([category, data]) => ({
      category,
      totalValue: data.value,
      totalCurrentValue: data.currentValue,
      percentage: totalValue > 0 ? (data.value / totalValue) * 100 : 0,
      count: data.count,
    }))
    .sort((a, b) => b.totalValue - a.totalValue);

  const topCategory = items[0]?.category ?? null;
  const profitLoss = totalCurrentValue - totalValue;
  const profitLossPercent = totalValue > 0 ? (profitLoss / totalValue) * 100 : 0;

  return {
    items,
    totalValue,
    totalCurrentValue,
    profitLoss,
    profitLossPercent,
    topCategory,
  };
}
