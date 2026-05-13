import { Globe2, ShieldCheck } from 'lucide-react';

export function RelayInstructions() {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-start gap-3">
        <div className="rounded-md bg-blue-50 p-2 text-blue-600 dark:bg-blue-950/30 dark:text-blue-300">
          <Globe2 className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Browser relay</h3>
          <p className="mt-1 text-sm leading-6 text-slate-500 dark:text-slate-400">
            URL extraction uses the shell/browser relay when available. In local mock mode, a
            representative table is generated for UI review.
          </p>
          <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300">
            <ShieldCheck className="h-3.5 w-3.5" />
            Preview before commit
          </div>
        </div>
      </div>
    </div>
  );
}
