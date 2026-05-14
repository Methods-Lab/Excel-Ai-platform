import { AlertTriangle, Check } from 'lucide-react';
import type { FlaggedCell, RowData, TableModel } from '@codex-excel/shared-types';

interface TableGridProps {
  table: TableModel;
  flaggedCells: FlaggedCell[];
  selectedFlaggedIndex: number | null;
  isEditMode: boolean;
  onCellClick: (row: number, col: number) => void;
  onCellChange: (row: number, col: number, value: string) => void;
  onAcceptSuggestion?: (row: number, col: number, suggested: string) => void;
}

function formatCell(cell: RowData) {
  if (typeof cell.value === 'number') {
    return Number.isInteger(cell.value) ? cell.value.toLocaleString() : String(cell.value);
  }
  return cell.value;
}

function isFlagged(flaggedCells: FlaggedCell[], row: number, col: number) {
  return flaggedCells.findIndex((cell) => cell.row === row && cell.col === col);
}

export function TableGrid({
  table,
  flaggedCells,
  selectedFlaggedIndex,
  isEditMode,
  onCellClick,
  onCellChange,
  onAcceptSuggestion,
}: TableGridProps) {
  // Defensive check for malformed table data
  if (!Array.isArray(table.columns) || !Array.isArray(table.rows)) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-slate-200 p-8 dark:border-slate-800">
        <div className="text-center">
          <AlertTriangle className="mx-auto h-8 w-8 text-red-500" />
          <h3 className="mt-2 text-sm font-semibold text-slate-900 dark:text-white">Invalid Table Data</h3>
          <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
            The table structure is malformed and cannot be displayed.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-auto rounded-lg border border-slate-200 dark:border-slate-800">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-slate-50 dark:bg-slate-900">
            <th className="sticky left-0 z-10 w-10 border-b border-r border-slate-200 bg-slate-50 px-2 py-2 text-center text-xs font-semibold text-slate-500 dark:border-slate-800 dark:bg-slate-900">
              #
            </th>
            {table.columns.map((column) => (
              <th
                key={column.name}
                className="min-w-32 border-b border-r border-slate-200 px-3 py-2 text-left text-xs font-semibold text-slate-700 dark:border-slate-800 dark:text-slate-300"
              >
                <div className="flex items-center gap-2">
                  <span>{column.name}</span>
                  <span className="rounded bg-slate-200 px-1 py-0.5 text-[10px] font-normal text-slate-500 dark:bg-slate-800">
                    {column.type}
                  </span>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row, rowIndex) => (
            <tr key={rowIndex} className="hover:bg-slate-50 dark:hover:bg-slate-900/70">
              <td className="sticky left-0 z-10 border-b border-r border-slate-200 bg-white px-2 py-2 text-center text-xs text-slate-400 dark:border-slate-800 dark:bg-slate-950">
                {rowIndex + 1}
              </td>
              {row.map((cell, colIndex) => {
                const flaggedIndex = isFlagged(flaggedCells, rowIndex, colIndex);
                const flagged = flaggedIndex >= 0;
                const selected = selectedFlaggedIndex === flaggedIndex;
                const flag = flagged ? flaggedCells[flaggedIndex] : null;

                return (
                  <td
                    key={`${rowIndex}-${colIndex}`}
                    onClick={() => onCellClick(rowIndex, colIndex)}
                    className={`border-b border-r border-slate-200 px-3 py-2 align-top dark:border-slate-800 ${
                      flagged ? 'bg-yellow-50 dark:bg-yellow-950/20' : ''
                    } ${selected ? 'ring-2 ring-blue-500 ring-inset' : ''}`}
                    title={flag ? `${flag.reason} — suggested: ${flag.suggestedFix}` : undefined}
                  >
                    <div className="flex min-h-8 items-center gap-2">
                      {isEditMode ? (
                        <input
                          value={String(cell.value)}
                          onChange={(event) => onCellChange(rowIndex, colIndex, event.target.value)}
                          className="w-full rounded-md border border-slate-300 bg-white px-2 py-1 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-900"
                        />
                      ) : (
                        <span className={flagged ? 'font-semibold text-amber-700 dark:text-amber-300' : ''}>
                          {formatCell(cell)}
                        </span>
                      )}
                      {flagged ? (
                        <div className="flex items-center gap-1">
                          <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 text-amber-500" />
                          {flag?.suggestedFix !== undefined && onAcceptSuggestion ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onAcceptSuggestion(rowIndex, colIndex, String(flag.suggestedFix));
                              }}
                              className="ml-1 rounded bg-amber-100 px-1 text-[10px] font-medium text-amber-800"
                            >
                              Accept
                            </button>
                          ) : null}
                        </div>
                      ) : cell.confidence >= 90 ? (
                        <Check className="h-3.5 w-3.5 flex-shrink-0 text-emerald-500 opacity-60" />
                      ) : null}
                    </div>
                    <div className="mt-1 text-[10px] text-slate-400">{cell.confidence}%</div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
