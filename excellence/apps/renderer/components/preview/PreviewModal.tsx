import { useMemo, useState } from 'react';
import { FileImage, FileText, Globe, Type, X } from 'lucide-react';
import type { ExtractionResult } from '@codex-excel/shared-types';
import { useExtraction } from '../../hooks/useExtraction';
import { useWorkbook } from '../../hooks/useWorkbook';
import { useWorkbookStore } from '../../stores/workbookStore';
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
  const { commitTable, extractFromText } = useExtraction();
  const { activeSheet, isLoaded } = useWorkbook();
  const { addToast } = useToast();
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedFlaggedCell, setSelectedFlaggedCell] = useState<number | null>(null);
  const [showCommitConfirm, setShowCommitConfirm] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);
  const [selectedSheet, setSelectedSheet] = useState<string | null>(activeSheet ?? null);
  const [startCell, setStartCell] = useState('A1');

  const sourceMeta = useMemo(() => {
    const source = previewResult?.source ?? 'text';
    return {
      Icon: sourceIcons[source],
      label: sourceLabels[source],
    };
  }, [previewResult?.source]);

  if (!previewResult) return null;

  const { table, flaggedCells } = previewResult;
  const sheets = useWorkbookStore((s) => s.sheets);
  const warnings = (previewResult as any).warnings ?? [];

  // Defensive check for malformed table data
  if (!table || !Array.isArray(table.rows) || !Array.isArray(table.columns)) {
    return (
      <section className="flex h-full flex-col bg-white dark:bg-slate-950">
        <header className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-red-100 px-2.5 py-1 text-xs font-medium text-red-600 dark:bg-red-900 dark:text-red-300">
              Error
            </span>
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
        <div className="flex flex-1 items-center justify-center p-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Extraction Error</h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              The extracted data is malformed. Please try uploading again or contact support.
            </p>
          </div>
        </div>
      </section>
    );
  }
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
  const parseCellAddress = (addr: string) => {
    const match = addr.toUpperCase().match(/^([A-Z]+)([0-9]+)$/);
    if (!match) return { row: 0, col: 0 };
    const letters = match[1];
    const row = parseInt(match[2], 10) - 1;
    let col = 0;
    for (let i = 0; i < letters.length; i++) {
      col = col * 26 + (letters.charCodeAt(i) - 65 + 1);
    }
    return { row, col: col - 1 };
  };

  const confirmCommit = async () => {
    setIsCommitting(true);
    try {
      const pos = parseCellAddress(startCell ?? 'A1');
      const response = await commitTable(selectedSheet ?? activeSheet ?? undefined, pos);
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

  const handleReextract = async () => {
    const instruction = window.prompt('Describe the cleanup or modifications you want to apply to this table');
    if (!instruction) return;
    try {
      const prompt = `Instruction: ${instruction}\n\nCurrent table: ${JSON.stringify(previewResult.table)}`;
      await extractFromText(prompt);
      addToast({ title: 'Re-clean requested', variant: 'success' });
    } catch (err) {
      addToast({ title: 'Re-clean failed', description: err instanceof Error ? err.message : 'Unknown', variant: 'error' });
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
            <div className="mt-0.5 flex items-center gap-3">
              <p className="text-xs text-slate-500">
                {table.rows.length} rows x {table.columns.length} columns
              </p>
              {isEditMode && <span className="ml-2 font-medium text-blue-600">Edit mode</span>}

              <div className="ml-auto flex items-center gap-2">
                <label className="text-xs text-slate-500">Sheet:</label>
                <select
                  value={selectedSheet ?? activeSheet ?? ''}
                  onChange={(e) => setSelectedSheet(e.target.value)}
                  className="rounded border border-slate-200 bg-white px-2 py-1 text-xs"
                >
                  {(sheets.length ? sheets : [{ name: activeSheet ?? 'Sheet1', tables: [] }]).map((s) => (
                    <option key={s.name} value={s.name}>
                      {s.name}
                    </option>
                  ))}
                </select>

                <label className="text-xs text-slate-500">Start:</label>
                <input
                  value={startCell}
                  onChange={(e) => setStartCell(e.target.value)}
                  className="w-20 rounded border border-slate-200 bg-white px-2 py-1 text-xs"
                />
              </div>
            </div>
          </div>
          <div className="flex-1 overflow-auto p-6">
            <div className="mb-4">
              <div className="flex items-center gap-3">
                <div className="w-full"> 
                  <div className="h-2 w-full overflow-hidden rounded bg-slate-100">
                    <div
                      className={`h-2 ${
                        previewResult.overallConfidence >= 85
                          ? 'bg-emerald-500'
                          : previewResult.overallConfidence >= 60
                          ? 'bg-amber-400'
                          : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.max(0, Math.min(100, previewResult.overallConfidence))}%` }}
                    />
                  </div>
                  <div className="mt-1 text-[11px] text-slate-500">Overall confidence: {previewResult.overallConfidence}%</div>
                </div>
                <div>
                  {warnings && warnings.length > 0 && (
                    <div className="rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
                      {warnings.length} warnings
                    </div>
                  )}
                </div>
              </div>
              {warnings && warnings.length > 0 && (
                <ul className="mt-2 space-y-1 text-xs text-slate-600">
                  {warnings.map((w: string, i: number) => (
                    <li key={i} className="rounded-md bg-amber-50 px-2 py-1">
                      {w}
                    </li>
                  ))}
                </ul>
              )}
            </div>

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
              onAcceptSuggestion={(row, col, suggested) => {
                const index = flaggedCells.findIndex((cell) => cell.row === row && cell.col === col);
                if (index >= 0) handleAcceptFix(index);
              }}
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
        acceptDisabled={!isLoaded}
        onReextract={handleReextract}
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
