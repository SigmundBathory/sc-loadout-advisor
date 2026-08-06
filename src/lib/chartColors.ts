/**
 * Canonical chart palette shared across recharts visualizations
 * (pie/donut, radar, bars) so colors stay consistent app-wide.
 */
export const CHART_COLORS = [
  "#6366f1",
  "#f59e0b",
  "#10b981",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
  "#f97316",
  "#ec4899",
  "#14b8a6",
  "#eab308",
] as const;

export const CHART_COLOR = (i: number): string => CHART_COLORS[i % CHART_COLORS.length];
