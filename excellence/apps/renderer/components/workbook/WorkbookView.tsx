import { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { useWorkbook } from '../../hooks/useWorkbook';
import { EmptyState } from '../shared/EmptyState';
import { SheetTabBar } from './SheetTabBar';

export function WorkbookView() {
  const { isLoaded, sheets, activeSheet, switchSheet, addSheet, loadWorkbook } = useWorkbook();
  const [expandedSheets, setExpandedSheets] = useState<Set<string>>(() => new Set());
  const [newSheetName, setNewSheetName] = useState('');
  const expanded = useMemo(() => {
    if (expandedSheets.size > 0) return expandedSheets;
    return new Set(sheets.map((sheet) => sheet.name));
  }, [expandedSheets, sheets]);

  const toggleSheet = (name: string) => {
    setExpandedSheets((current) => {
      const next = new Set(current.size ? current : sheets.map((sheet) => sheet.name));
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const handleAddSheet = () => {
    const name = newSheetName.trim();
    if (!name) return;
    addSheet(name);
    setExpandedSheets((current) => new Set([...current, name]));
    setNewSheetName('');
  };

  if (!isLoaded) {
    return (
      <div className="p-3">
        <EmptyState
          icon="workbook"
          title="No workbook loaded"
          description="Load an Excel workbook before committing extracted tables."
          action={{
            label: 'Load workbook',
            onClick: () => {
              const path = window.prompt('Enter workbook file path');
              if (path) void loadWorkbook(path);
            },
          }}
        />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <SheetTabBar
        sheets={sheets}
        activeSheet={activeSheet}
        expandedSheets={expanded}
        onSwitchSheet={switchSheet}
        onToggleSheet={toggleSheet}
      />
      <div className="flex gap-2">
        <input
          value={newSheetName}
          onChange={(event) => setNewSheetName(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') handleAddSheet();
          }}
          placeholder="New sheet"
          className="min-w-0 flex-1 rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900"
        />
        <button
          type="button"
          onClick={handleAddSheet}
          aria-label="Add sheet"
          className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
