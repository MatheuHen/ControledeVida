import {
  endOfDay,
  endOfMonth,
  endOfYear,
  format,
  startOfDay,
  startOfMonth,
  startOfYear,
  subDays,
} from "date-fns";

export type PeriodPreset =
  | "today"
  | "7d"
  | "30d"
  | "month"
  | "year"
  | "custom";

export type DateRange = { from: Date; to: Date };

export function getDateRange(preset: Exclude<PeriodPreset, "custom">): DateRange {
  const now = new Date();

  switch (preset) {
    case "today":
      return { from: startOfDay(now), to: endOfDay(now) };
    case "7d":
      return { from: startOfDay(subDays(now, 6)), to: endOfDay(now) };
    case "30d":
      return { from: startOfDay(subDays(now, 29)), to: endOfDay(now) };
    case "month":
      return { from: startOfMonth(now), to: endOfMonth(now) };
    case "year":
      return { from: startOfYear(now), to: endOfYear(now) };
  }
}

export function normalizeRangeKey(range: DateRange): string {
  return `${format(range.from, "yyyy-MM-dd")}__${format(range.to, "yyyy-MM-dd")}`;
}
