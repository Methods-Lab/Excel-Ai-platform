import { AlertTriangle, ArrowRight, Check, EyeOff, MapPin, ShieldCheck } from 'lucide-react';
import type { FlaggedCell } from '@codex-excel/shared-types';

interface FlaggedCellEditorProps {
  flaggedCells: FlaggedCell[];
  selectedIndex: number | null;
  onSelect: (index: number) => void;
  onAcceptFix: (index: number) => void;
  onIgnore: (index: number) => void;
}

export function FlaggedCellEditor({
  flaggedCells,
  selectedIndex,
  onSelect,
  onAcceptFix,
  onIgnore,
}: FlaggedCellEditorProps) {
  if (!flaggedCells.length) {
    return (
      <div className="flex flex-col items-center justify-center px-4 py-8 text-center">
        <ShieldCheck className="mb-3 h-10 w-10 text-emerald-500" />
        <p className="text-sm font-semibold text-slate-900 dark:text-white">No flagged cells</p>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          The current table passes confidence checks.
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-slate-100 dark:divide-slate-800">
      {flaggedCells.map((cell, index) => (
        <div
          role="button"
          tabIndex={0}
          key={`${cell.row}-${cell.col}-${index}`}
          onClick={() => onSelect(index)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              onSelect(index);
            }
          }}
          className={`block w-full p-4 text-left transition-colors ${
            selectedIndex === index
              ? 'bg-blue-50 dark:bg-blue-950/30'
              : 'hover:bg-slate-50 dark:hover:bg-slate-900'
          }`}
        >
          <div className="flex items-start gap-2">
            <MapPin className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-slate-400" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Row {cell.row + 1}, Col {cell.col + 1}
                </span>
                <span className="inline-flex items-center gap-1 rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-medium text-red-700 dark:bg-red-950/30 dark:text-red-300">
                  <AlertTriangle className="h-3 w-3" />
                  Flagged
                </span>
              </div>
              <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-slate-400">
                {cell.reason}
              </p>
              <div className="mt-3 flex items-center gap-2">
                <ValuePill label="Current" value={cell.currentValue} />
                <ArrowRight className="h-4 w-4 flex-shrink-0 text-slate-300" />
                <ValuePill label="Suggested" value={cell.suggestedFix} tone="blue" />
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onAcceptFix(index);
                  }}
                  className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
                >
                  <Check className="h-3.5 w-3.5" />
                  Accept
                </button>
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    onIgnore(index);
                  }}
                  className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  <EyeOff className="h-3.5 w-3.5" />
                  Ignore
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ValuePill({
  label,
  value,
  tone = 'slate',
}: {
  label: string;
  value: string;
  tone?: 'slate' | 'blue';
}) {
  return (
    <span className="min-w-0 flex-1">
      <span className="block text-[10px] uppercase text-slate-400">{label}</span>
      <span
        className={`mt-0.5 block truncate rounded px-2 py-1 text-sm font-medium ${
          tone === 'blue'
            ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300'
            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200'
        }`}
      >
        {value}
      </span>
    </span>
  );
}
