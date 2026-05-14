import { AlertCircle, CheckCircle } from 'lucide-react';

interface ConfidenceBadgeProps {
  value: number;
  compact?: boolean;
}

export function ConfidenceBadge({ value, compact = false }: ConfidenceBadgeProps) {
  const rounded = Math.round(value);
  // Use thresholds: green >=85, yellow >=60, red otherwise
  const isHigh = rounded >= 85;
  const isMedium = rounded >= 60;
  const classes = isHigh
    ? 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300'
    : isMedium
      ? 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300'
      : 'border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300';
  const Icon = isHigh ? CheckCircle : AlertCircle;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 font-semibold ${classes} ${
        compact ? 'text-xs' : 'text-sm'
      }`}
    >
      <Icon className={compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
      {rounded}%{!compact && ' confidence'}
    </span>
  );
}
