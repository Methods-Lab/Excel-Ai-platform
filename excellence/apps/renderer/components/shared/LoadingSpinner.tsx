import { Loader2 } from 'lucide-react';

interface LoadingSpinnerProps {
  label?: string;
  className?: string;
}

export function LoadingSpinner({ label, className = '' }: LoadingSpinnerProps) {
  return (
    <span className={`inline-flex items-center gap-2 text-sm text-slate-500 ${className}`}>
      <Loader2 className="h-4 w-4 animate-spin" />
      {label && <span>{label}</span>}
    </span>
  );
}
