import { create } from 'zustand';
import type { SheetInfo, TableModel, WorkbookInfo } from '@codex-excel/shared-types';

interface WorkbookState {
  workbookPath: string | null;
  sheets: SheetInfo[];
  activeSheet: string | null;
  isLoaded: boolean;
  error: string | null;
  tableCount: number;
  canUndo: boolean;
  lastCommit: { sheetName: string; tableId: string } | null;
  loadWorkbook: (workbook: WorkbookInfo) => void;
  closeWorkbook: () => void;
  switchSheet: (name: string) => void;
  addSheet: (name: string) => void;
  addTableToSheet: (sheetName: string, table: TableModel) => void;
  recordCommit: (sheetName: string, table: TableModel) => void;
  rollbackLastCommit: () => boolean;
  setError: (error: string | null) => void;
}

export const useWorkbookStore = create<WorkbookState>((set) => ({
  workbookPath: null,
  sheets: [],
  activeSheet: null,
  isLoaded: false,
  error: null,
  tableCount: 0,
  canUndo: false,
  lastCommit: null,
  loadWorkbook: (workbook) =>
    set({
      workbookPath: workbook.path,
      sheets: workbook.sheets,
      activeSheet: workbook.sheets[0]?.name ?? null,
      isLoaded: true,
      error: null,
      tableCount: workbook.sheets.reduce((total, s) => total + s.tables.length, 0),
    }),
  closeWorkbook: () =>
    set({
      workbookPath: null,
      sheets: [],
      activeSheet: null,
      isLoaded: false,
      tableCount: 0,
      canUndo: false,
      lastCommit: null,
      error: null,
    }),
  switchSheet: (name) =>
    set((state) => ({
      activeSheet: state.sheets.some((sheet) => sheet.name === name)
        ? name
        : state.activeSheet,
    })),
  addSheet: (name) =>
    set((state) => {
      if (state.sheets.some((sheet) => sheet.name === name)) {
        return { error: `Sheet "${name}" already exists.` };
      }

      return {
        sheets: [...state.sheets, { name, tables: [] }],
        activeSheet: name,
        error: null,
        isLoaded: state.isLoaded || state.sheets.length === 0,
      };
    }),
  addTableToSheet: (sheetName, table) =>
    set((state) => {
      const sheets = state.sheets.length ? state.sheets : [{ name: sheetName, tables: [] }];
      const nextSheets = sheets.map((sheet) =>
        sheet.name === sheetName
          ? { ...sheet, tables: [...sheet.tables, { ...table, sheetName }] }
          : sheet
      );

      if (!nextSheets.some((sheet) => sheet.name === sheetName)) {
        nextSheets.push({ name: sheetName, tables: [{ ...table, sheetName }] });
      }

      return {
        sheets: nextSheets,
        activeSheet: sheetName,
        isLoaded: true,
        error: null,
        tableCount: state.tableCount + 1,
        canUndo: state.canUndo,
        lastCommit: state.lastCommit,
      };
    }),
  recordCommit: (sheetName, table) =>
    set((state) => ({
      tableCount: state.tableCount + 1,
      canUndo: true,
      lastCommit: { sheetName, tableId: table.id },
      // keep existing arrays intact (caller should have added table already)
      sheets: state.sheets,
      activeSheet: state.activeSheet,
      isLoaded: state.isLoaded,
      error: state.error,
    })),
  rollbackLastCommit: () =>
    set((state) => {
      const last = state.lastCommit;
      if (!last) return { ...state } as any;

      const nextSheets = state.sheets.map((sheet) =>
        sheet.name === last.sheetName
          ? { ...sheet, tables: sheet.tables.filter((t) => t.id !== last.tableId) }
          : sheet
      );

      return {
        sheets: nextSheets,
        tableCount: Math.max(0, state.tableCount - 1),
        canUndo: false,
        lastCommit: null,
        activeSheet: state.activeSheet,
        isLoaded: state.isLoaded,
        error: state.error,
      };
    }),
  setError: (error) => set({ error }),
}));
