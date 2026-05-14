import { AlertTriangle, ArrowRight, CheckCircle, FileSpreadsheet } from 'lucide-react';
import type { ExtractionResult } from '@excellence/shared-types';
import { useExtractionStore } from '../../stores/extractionStore';
import { ConfidenceBadge } from '../preview/ConfidenceBadge';

interface TablePreviewCardProps {
  result: ExtractionResult;
}

export function TablePreviewCard({ result }: TablePreviewCardProps) {
  const showPreview = useExtractionStore((state) => state.showPreview);
  const jobId = `chat-preview-${result.table.id}`;

  return (
    <button
      type="button"
      onClick={() => showPreview(jobId, result)}
      className="mt-3 w-full overflow-hidden rounded-lg border border-slate-200 bg-white text-left transition-colors hover:border-blue-300 hover:bg-blue-50/40 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-blue-800 dark:hover:bg-blue-950/20"
    >
      <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3 dark:border-slate-800">
        <div className="rounded-md bg-blue-50 p-2 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400">
          <FileSpreadsheet className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="truncate text-sm font-semibold text-slate-900 dark:text-white">
            {result.table.tableName ?? 'Extracted table'}
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {result.table.rows.length} rows, {result.table.columns.length} columns
          </p>
        </div>
        <ArrowRight className="h-4 w-4 flex-shrink-0 text-slate-400" />
      </div>
      <div className="flex flex-wrap items-center gap-2 px-4 py-3">
        <ConfidenceBadge value={result.overallConfidence} compact />
        {result.flaggedCells.length > 0 ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-1 text-xs font-semibold text-red-700 dark:bg-red-950/30 dark:text-red-300">
            <AlertTriangle className="h-3.5 w-3.5" />
            {result.flaggedCells.length} flagged
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
            <CheckCircle className="h-3.5 w-3.5" />
            No flags
          </span>
        )}
      </div>
    </button>
  );
}
