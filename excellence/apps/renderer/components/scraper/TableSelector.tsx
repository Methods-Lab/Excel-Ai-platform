import { Table } from 'lucide-react';
import type { TableModel } from '@excellence/shared-types';

interface TableSelectorProps {
  tables: TableModel[];
  selectedId?: string;
  onSelect: (table: TableModel) => void;
}

export function TableSelector({ tables, selectedId, onSelect }: TableSelectorProps) {
  if (!tables.length) {
    return (
      <div className="rounded-lg border border-dashed border-slate-200 p-4 text-sm text-slate-500 dark:border-slate-800">
        No tables detected yet.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {tables.map((table) => (
        <button
          type="button"
          key={table.id}
          onClick={() => onSelect(table)}
          className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left ${
            selectedId === table.id
              ? 'border-blue-400 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30'
              : 'border-slate-200 bg-white hover:border-blue-300 dark:border-slate-800 dark:bg-slate-900'
          }`}
        >
          <Table className="h-4 w-4 flex-shrink-0 text-blue-600" />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold text-slate-900 dark:text-white">
              {table.tableName ?? 'Detected table'}
            </span>
            <span className="block text-xs text-slate-500">
              {table.rows.length} rows x {table.columns.length} columns
            </span>
          </span>
        </button>
      ))}
    </div>
  );
}
