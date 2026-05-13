interface ProgressBarProps {
  value: number;
  label?: string;
  tone?: 'blue' | 'green' | 'amber' | 'red';
}

const toneClasses = {
  blue: 'bg-blue-600',
  green: 'bg-emerald-600',
  amber: 'bg-amber-500',
  red: 'bg-red-600',
};

export function ProgressBar({ value, label, tone = 'blue' }: ProgressBarProps) {
  const clampedValue = Math.max(0, Math.min(100, Math.round(value)));

  return (
    <div className="w-full">
      {(label || clampedValue > 0) && (
        <div className="mb-1 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>{label}</span>
          <span>{clampedValue}%</span>
        </div>
      )}
      <div className="h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
        <div
          className={`h-full rounded-full transition-all duration-300 ${toneClasses[tone]}`}
          style={{ width: `${clampedValue}%` }}
        />
      </div>
    </div>
  );
}
