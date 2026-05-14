import React from 'react';
import { FolderOpen, RotateCcw, ScanText, ShieldCheck } from 'lucide-react';
import { useIPCBridge } from '../../hooks/useIPCBridge';
import { useWorkbook } from '../../hooks/useWorkbook';
import { useToast } from '../shared/Toast';
import { WorkbookStatusBar } from '../workbook/WorkbookStatusBar';
import { WorkbookView } from '../workbook/WorkbookView';
import { useSettingsStore } from '../../stores/settingsStore';
import { useWorkbookStore } from '../../stores/workbookStore';

export function Sidebar() {
  const { loadWorkbook, closeWorkbook, isLoaded, error } = useWorkbook();
  const { isMockMode, isElectron } = useIPCBridge();
  const { addToast } = useToast();

  const handleLoadWorkbook = async () => {
    try {
      await loadWorkbook();
      addToast({ title: 'Workbook loaded', variant: 'success' });
    } catch (caught) {
      addToast({
        title: 'Workbook load failed',
        description: caught instanceof Error ? caught.message : 'Unknown error',
        variant: 'error',
      });
    }
  };

  return (
    <aside className="flex h-full flex-col">
      <header className="border-b border-slate-200 px-4 py-3 dark:border-slate-800">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Workbook
        </h2>
      </header>

      <div className="flex-1 space-y-4 overflow-y-auto p-3">
        <WorkbookStatusBar />
        <WorkbookView />
        {error && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
            {error}
          </div>
        )}
        <GuardrailStatus isMockMode={isMockMode} isElectron={isElectron} />
      </div>

      <footer className="space-y-2 border-t border-slate-200 p-3 dark:border-slate-800">
        <button
          type="button"
          onClick={handleLoadWorkbook}
          className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-blue-600 px-3 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          <FolderOpen className="h-4 w-4" />
          Load workbook
        </button>
        {isLoaded && (
          <button
            type="button"
            onClick={closeWorkbook}
            className="inline-flex w-full items-center justify-center rounded-md bg-slate-100 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            Close workbook
          </button>
        )}
      </footer>
    </aside>
  );
}

function GuardrailStatus({
  isMockMode,
  isElectron,
}: {
  isMockMode: boolean;
  isElectron: boolean;
}) {
  const ocrThreshold = useSettingsStore((s) => s.ocrConfidenceThreshold);
  const setOcr = useSettingsStore((s) => s.updateSetting);
  const workbookStore = useWorkbookStore();
  const [showOcrEditor, setShowOcrEditor] = React.useState(false);

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        Guardrails
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="min-w-0 rounded-md border border-slate-100 px-2 py-2 dark:border-slate-800">
          <ShieldCheck className="mb-1 h-3.5 w-3.5 text-blue-600" />
          <div className="truncate text-[11px] text-slate-500">IPC</div>
          <div className="truncate text-xs font-semibold text-slate-900 dark:text-white">{isElectron ? 'Electron' : isMockMode ? 'Mock' : 'Required'}</div>
        </div>

        <div className="min-w-0 rounded-md border border-slate-100 px-2 py-2 dark:border-slate-800">
          <ScanText className="mb-1 h-3.5 w-3.5 text-blue-600" />
          <div className="truncate text-[11px] text-slate-500">OCR</div>
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold text-slate-900 dark:text-white">{ocrThreshold}%</div>
            <button
              type="button"
              onClick={() => setShowOcrEditor((v) => !v)}
              className="text-[11px] text-blue-600 hover:underline"
            >
              Adjust
            </button>
          </div>
          {showOcrEditor && (
            <div className="mt-2">
              <input
                type="range"
                min={10}
                max={100}
                step={5}
                value={ocrThreshold}
                onChange={(e) => setOcr('ocrConfidenceThreshold' as any, Number(e.target.value))}
              />
            </div>
          )}
        </div>

        <div className="min-w-0 rounded-md border border-slate-100 px-2 py-2 dark:border-slate-800">
          <RotateCcw className="mb-1 h-3.5 w-3.5 text-blue-600" />
          <div className="truncate text-[11px] text-slate-500">Undo</div>
          <div className="mt-1">
            <button
              type="button"
              disabled={!workbookStore.canUndo}
              onClick={() => {
                // Prefer desktop rollback API if available
                try {
                  if ((window as any).electronAPI?.workbook?.rollback) {
                    (window as any).electronAPI.workbook.rollback();
                  } else {
                    workbookStore.rollbackLastCommit();
                  }
                } catch (err) {
                  console.error('Rollback failed', err);
                }
              }}
              className={`rounded-md px-2 py-1 text-xs font-semibold ${workbookStore.canUndo ? 'text-slate-900 bg-slate-100' : 'text-slate-400 bg-slate-50'}`}
            >
              {workbookStore.canUndo ? 'Armed' : 'None'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
