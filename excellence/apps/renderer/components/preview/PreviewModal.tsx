import { useMemo, useState } from 'react';
import { FileImage, FileText, Globe, Type, X } from 'lucide-react';
import type { ExtractionResult } from '@excellence/shared-types';
import { useExtraction } from '../../hooks/useExtraction';
import { useWorkbook } from '../../hooks/useWorkbook';
import { useExtractionStore } from '../../stores/extractionStore';
import { ConfirmDialog } from '../shared/ConfirmDialog';
import { useToast } from '../shared/Toast';
import { CommitBar } from './CommitBar';
import { ConfidenceBadge } from './ConfidenceBadge';
import { FlaggedCellEditor } from './FlaggedCellEditor';
import { TableGrid } from './TableGrid';

const sourceIcons = {
  image: FileImage,
  url: Globe,
  text: Type,
  document: FileText,
};

const sourceLabels = {
  image: 'Image',
  url: 'URL',
  text: 'Text',
  document: 'Document',
};

export function PreviewModal() {
  const previewResult = useExtractionStore((state) => state.previewResult);
  const updatePreviewResult = useExtractionStore((state) => state.updatePreviewResult);
  const dismissPreview = useExtractionStore((state) => state.dismissPreview);
  const { commitTable } = useExtraction();
  const { activeSheet, isLoaded } = useWorkbook();
  const { addToast } = useToast();
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedFlaggedCell, setSelectedFlaggedCell] = useState<number | null>(null);
  const [showCommitConfirm, setShowCommitConfirm] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);

  const sourceMeta = useMemo(() => {
    const source = previewResult?.source ?? 'text';
    return {
      Icon: sourceIcons[source],
      label: sourceLabels[source],
    };
  }, [previewResult?.source]);

  if (!previewResult) return null;

  const { table, flaggedCells } = previewResult;
  const SourceIcon = sourceMeta.Icon;

  const syncPreview = (next: ExtractionResult) => {
    updatePreviewResult(next);
    if (selectedFlaggedCell !== null && selectedFlaggedCell >= next.flaggedCells.length) {
      setSelectedFlaggedCell(next.flaggedCells.length ? next.flaggedCells.length - 1 : null);
    }
  };

  const recomputeConfidence = (rows: ExtractionResult['table']['rows']) => {
    const cells = rows.flat();
    if (!cells.length) return 100;
    return Math.round(cells.reduce((sum, cell) => sum + cell.confidence, 0) / cells.length);
  };

  const parseValue = (col: number, value: string | number) => {
    const columnType = table.columns[col]?.type;
    if (columnType === 'number' || columnType === 'currency') {
      return typeof value === 'number' ? value : Number.parseFloat(value) || 0;
    }
    return value;
  };

  const updateCell = (
    row: number,
    col: number,
    value: string | number,
    options: { clearFlag?: boolean; confidence?: number } = {}
  ) => {
    const nextRows = table.rows.map((tableRow, rowIndex) =>
      tableRow.map((cell, colIndex) =>
        rowIndex === row && colIndex === col
          ? {
              ...cell,
              value: parseValue(col, value),
              confidence: options.confidence ?? cell.confidence,
              flagged: options.clearFlag ? false : cell.flagged,
              suggestedFix: options.clearFlag ? undefined : cell.suggestedFix,
            }
          : cell
      )
    );

    const nextFlaggedCells = options.clearFlag
      ? flaggedCells.filter((cell) => cell.row !== row || cell.col !== col)
      : flaggedCells.map((cell) =>
          cell.row === row && cell.col === col ? { ...cell, currentValue: String(value) } : cell
        );

    syncPreview({
      ...previewResult,
      table: { ...table, rows: nextRows },
      flaggedCells: nextFlaggedCells,
      overallConfidence: recomputeConfidence(nextRows),
    });
  };

  const handleAcceptFix = (index: number) => {
    const flaggedCell = flaggedCells[index];
    if (!flaggedCell) return;
    updateCell(flaggedCell.row, flaggedCell.col, flaggedCell.suggestedFix, {
      clearFlag: true,
      confidence: 100,
    });
    addToast({ title: 'Fix accepted', description: `Updated row ${flaggedCell.row + 1}.`, variant: 'success' });
  };

  const handleIgnoreFlag = (index: number) => {
    const flaggedCell = flaggedCells[index];
    if (!flaggedCell) return;
    updateCell(flaggedCell.row, flaggedCell.col, flaggedCell.currentValue, {
      clearFlag: true,
      confidence: 90,
    });
  };

  const handleCommitRequest = () => {
    if (!isLoaded) {
      addToast({
        title: 'No workbook loaded',
        description: 'Load a workbook before committing extracted data.',
        variant: 'warning',
      });
      return;
    }
    setShowCommitConfirm(true);
  };

  const confirmCommit = async () => {
    setIsCommitting(true);
    try {
      const response = await commitTable(activeSheet ?? undefined);
      addToast({
        title: 'Table committed',
        description: `Written to ${response.sheetName} at ${response.range}.`,
        variant: 'success',
      });
      dismissPreview();
    } catch (caught) {
      addToast({
        title: 'Commit failed',
        description: caught instanceof Error ? caught.message : 'Unknown error',
        variant: 'error',
      });
    } finally {
      setIsCommitting(false);
      setShowCommitConfirm(false);
    }
  };

  return (
    <section className="flex h-full flex-col bg-white dark:bg-slate-950">
      <header className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            <SourceIcon className="h-4 w-4" />
            {sourceMeta.label}
          </span>
          <ConfidenceBadge value={previewResult.overallConfidence} />
          {flaggedCells.length > 0 && (
            <span className="rounded-full border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">
              {flaggedCells.length} flagged
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={dismissPreview}
          aria-label="Dismiss preview"
          className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
        >
          <X className="h-5 w-5" />
        </button>
      </header>

      <div className="flex min-h-0 flex-1">
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="border-b border-slate-100 px-6 py-3 dark:border-slate-800">
            <h3 className="truncate text-sm font-semibold text-slate-900 dark:text-white">
              {table.tableName ?? 'Extracted data'}
            </h3>
            <p className="mt-0.5 text-xs text-slate-500">
              {table.rows.length} rows x {table.columns.length} columns
              {isEditMode && <span className="ml-2 font-medium text-blue-600">Edit mode</span>}
            </p>
          </div>
          <div className="flex-1 overflow-auto p-6">
            <TableGrid
              table={table}
              flaggedCells={flaggedCells}
              selectedFlaggedIndex={selectedFlaggedCell}
              isEditMode={isEditMode}
              onCellClick={(row, col) => {
                const index = flaggedCells.findIndex((cell) => cell.row === row && cell.col === col);
                if (index >= 0) setSelectedFlaggedCell(index);
              }}
              onCellChange={(row, col, value) => updateCell(row, col, value)}
            />
          </div>
        </div>

        <aside className="hidden w-80 flex-shrink-0 border-l border-slate-200 dark:border-slate-800 xl:flex xl:flex-col">
          <div className="border-b border-slate-100 px-4 py-3 dark:border-slate-800">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Flagged cells</h3>
          </div>
          <div className="flex-1 overflow-y-auto">
            <FlaggedCellEditor
              flaggedCells={flaggedCells}
              selectedIndex={selectedFlaggedCell}
              onSelect={setSelectedFlaggedCell}
              onAcceptFix={handleAcceptFix}
              onIgnore={handleIgnoreFlag}
            />
          </div>
        </aside>
      </div>

      <CommitBar
        isEditMode={isEditMode}
        isCommitting={isCommitting}
        onToggleEdit={() => setIsEditMode((value) => !value)}
        onDismiss={dismissPreview}
        onCommit={handleCommitRequest}
      />

      <ConfirmDialog
        isOpen={showCommitConfirm}
        onConfirm={confirmCommit}
        onCancel={() => setShowCommitConfirm(false)}
        title="Commit to workbook?"
        message={`This will write "${table.tableName ?? 'Untitled table'}" to "${
          activeSheet ?? 'Sheet1'
        }". Existing cells in the target range may be overwritten by the shell handler.`}
        confirmLabel="Commit"
      />
    </section>
  );
}
