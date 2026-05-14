import { create } from 'zustand';
import type { SheetInfo, TableModel, WorkbookInfo } from '@excellence/shared-types';

interface SheetState extends SheetInfo {
  tables: TableModel[];
}

interface WorkbookState {
  workbookPath: string | null;
  sheets: SheetState[];
  activeSheet: string | null;
  isLoaded: boolean;
  error: string | null;
  loadWorkbook: (workbook: WorkbookInfo) => void;
  closeWorkbook: () => void;
  switchSheet: (name: string) => void;
  addSheet: (name: string) => void;
  addTableToSheet: (sheetName: string, table: TableModel) => void;
  setError: (error: string | null) => void;
}

export const useWorkbookStore = create<WorkbookState>((set) => ({
  workbookPath: null,
  sheets: [],
  activeSheet: null,
  isLoaded: false,
  error: null,
  loadWorkbook: (workbook) =>
    set({
      workbookPath: workbook.filePath,
      sheets: workbook.sheets.map((sheet) => ({ ...sheet, tables: [] })),
      activeSheet: workbook.sheets[0]?.name ?? null,
      isLoaded: true,
      error: null,
    }),
  closeWorkbook: () =>
    set({
      workbookPath: null,
      sheets: [],
      activeSheet: null,
      isLoaded: false,
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
        sheets: [...state.sheets, { name, rowCount: 0, colCount: 0, tables: [] }],
        activeSheet: name,
        error: null,
        isLoaded: state.isLoaded || state.sheets.length === 0,
      };
    }),
  addTableToSheet: (sheetName, table) =>
    set((state) => {
      const sheets = state.sheets.length
        ? state.sheets
        : [{ name: sheetName, rowCount: 0, colCount: 0, tables: [] }];
      const nextSheets = sheets.map((sheet) =>
        sheet.name === sheetName
          ? { ...sheet, tables: [...sheet.tables, { ...table, sheetName }] }
          : sheet
      );

      if (!nextSheets.some((sheet) => sheet.name === sheetName)) {
        nextSheets.push({
          name: sheetName,
          rowCount: 0,
          colCount: 0,
          tables: [{ ...table, sheetName }],
        });
      }

      return {
        sheets: nextSheets,
        activeSheet: sheetName,
        isLoaded: true,
        error: null,
      };
    }),
  setError: (error) => set({ error }),
}));
