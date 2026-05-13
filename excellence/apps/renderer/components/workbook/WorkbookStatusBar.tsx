import { Database, FileSpreadsheet, ShieldCheck } from 'lucide-react';
import { useWorkbook } from '../../hooks/useWorkbook';

export function WorkbookStatusBar() {
  const { isLoaded, workbookPath, sheets } = useWorkbook();
  const tableCount = sheets.reduce((total, sheet) => total + sheet.tables.length, 0);

  return (
    <div className="grid grid-cols-3 gap-2 rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
      <StatusItem
        icon={FileSpreadsheet}
        label="Workbook"
        value={isLoaded ? workbookPath?.split(/[\\/]/).pop() ?? 'Loaded' : 'None'}
      />
      <StatusItem icon={Database} label="Tables" value={String(tableCount)} />
      <StatusItem icon={ShieldCheck} label="Mode" value="Preview-first" />
    </div>
  );
}

function StatusItem({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof FileSpreadsheet;
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0">
      <div className="mb-1 inline-flex rounded-md bg-slate-100 p-1 text-slate-500 dark:bg-slate-800">
        <Icon className="h-3.5 w-3.5" />
      </div>
      <div className="text-[11px] text-slate-500 dark:text-slate-400">{label}</div>
      <div className="truncate text-xs font-semibold text-slate-900 dark:text-white">{value}</div>
    </div>
  );
}
