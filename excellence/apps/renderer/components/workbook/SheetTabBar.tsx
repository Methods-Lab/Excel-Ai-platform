import { ChevronDown, ChevronRight, FileSpreadsheet, Table } from 'lucide-react';
import type { SheetInfo } from '@excellence/shared-types';

interface SheetTabBarProps {
  sheets: SheetInfo[];
  activeSheet: string | null;
  expandedSheets: Set<string>;
  onSwitchSheet: (name: string) => void;
  onToggleSheet: (name: string) => void;
}

export function SheetTabBar({
  sheets,
  activeSheet,
  expandedSheets,
  onSwitchSheet,
  onToggleSheet,
}: SheetTabBarProps) {
  return (
    <div className="space-y-1">
      {sheets.map((sheet) => {
        const isActive = sheet.name === activeSheet;
        const isExpanded = expandedSheets.has(sheet.name);

        return (
          <div key={sheet.name}>
            <div
              className={`flex items-center gap-2 rounded-md px-2 py-1.5 ${
                isActive
                  ? 'bg-blue-50 text-blue-800 dark:bg-blue-950/40 dark:text-blue-200'
                  : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800'
              }`}
            >
              <button
                type="button"
                onClick={() => onToggleSheet(sheet.name)}
                aria-label={isExpanded ? `Collapse ${sheet.name}` : `Expand ${sheet.name}`}
                className="rounded p-0.5 hover:bg-white/70 dark:hover:bg-slate-900"
              >
                {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
              </button>
              <button
                type="button"
                onClick={() => onSwitchSheet(sheet.name)}
                className="flex min-w-0 flex-1 items-center gap-2 text-left"
              >
                <FileSpreadsheet className="h-4 w-4 flex-shrink-0" />
                <span className="truncate text-sm font-medium">{sheet.name}</span>
              </button>
              <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-xs text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                {sheet.tables.length}
              </span>
            </div>
            {isExpanded && sheet.tables.length > 0 && (
              <div className="ml-8 mt-1 space-y-1">
                {sheet.tables.map((table) => (
                  <div
                    key={table.id}
                    className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-900"
                  >
                    <Table className="h-3.5 w-3.5 flex-shrink-0" />
                    <span className="truncate">{table.tableName ?? 'Untitled table'}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
