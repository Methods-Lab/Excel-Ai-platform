import { FolderOpen, RotateCcw, ScanText, ShieldCheck } from 'lucide-react';
import { useWorkbook } from '../../hooks/useWorkbook';
import { useToast } from '../shared/Toast';
import { WorkbookStatusBar } from '../workbook/WorkbookStatusBar';
import { WorkbookView } from '../workbook/WorkbookView';

export function Sidebar() {
  const { loadWorkbook, closeWorkbook, isLoaded, error } = useWorkbook();
  const isElectron = typeof window !== 'undefined' && !!window.electronAPI;
  const isMockMode = import.meta.env.VITE_ENABLE_MOCK_IPC === 'true';
  const { addToast } = useToast();

  const handleLoadWorkbook = async () => {
    try {
      const path = window.prompt('Enter workbook file path');
      if (!path) return;
      await loadWorkbook(path);
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
  const items = [
    { label: 'IPC', value: isElectron ? 'Electron' : isMockMode ? 'Mock' : 'Required', icon: ShieldCheck },
    { label: 'OCR', value: '0.75', icon: ScanText },
    { label: 'Undo', value: 'Armed', icon: RotateCcw },
  ];

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
        Guardrails
      </div>
      <div className="grid grid-cols-3 gap-2">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="min-w-0 rounded-md border border-slate-100 px-2 py-2 dark:border-slate-800">
              <Icon className="mb-1 h-3.5 w-3.5 text-blue-600" />
              <div className="truncate text-[11px] text-slate-500">{item.label}</div>
              <div className="truncate text-xs font-semibold text-slate-900 dark:text-white">{item.value}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
