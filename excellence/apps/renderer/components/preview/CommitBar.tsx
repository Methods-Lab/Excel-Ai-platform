import { Loader2, Pencil, Save, X } from 'lucide-react';

interface CommitBarProps {
  isEditMode: boolean;
  isCommitting: boolean;
  onToggleEdit: () => void;
  onDismiss: () => void;
  onCommit: () => void;
  acceptDisabled?: boolean;
  onReextract?: () => void;
}

export function CommitBar({
  isEditMode,
  isCommitting,
  onToggleEdit,
  onDismiss,
  onCommit,
  acceptDisabled = false,
  onReextract,
}: CommitBarProps) {
  return (
    <div className="flex items-center justify-between border-t border-slate-200 px-6 py-4 dark:border-slate-800">
      <div className="flex items-center gap-2">
        <button
        type="button"
        onClick={onToggleEdit}
        className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
          isEditMode
            ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'
            : 'bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
        }`}
      >
        <Pencil className="h-4 w-4" />
        {isEditMode ? 'Done editing' : 'Edit table'}
      </button>
        {onReextract && (
          <button
            type="button"
            onClick={onReextract}
            className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium bg-amber-50 text-amber-700 hover:bg-amber-100"
          >
            Re-clean
          </button>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onDismiss}
          className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          <X className="h-4 w-4" />
          Dismiss
        </button>
        <button
          type="button"
          onClick={onCommit}
          disabled={isCommitting || acceptDisabled}
          title={acceptDisabled ? 'Load a workbook first' : undefined}
          className={`inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-white transition-colors ${
            isCommitting || acceptDisabled
              ? 'bg-blue-300 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isCommitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {isCommitting ? 'Committing...' : 'Commit to sheet'}
        </button>
      </div>
    </div>
  );
}
