import type { TableModel } from '@excel-ai-platform/extraction-core';

export interface WorkbookInfo {
  filePath: string;
  sheets: SheetInfo[];
  lockedByExcel: boolean;
}

export interface SheetInfo {
  name: string;
  rowCount: number;
  colCount: number;
}

export interface InsertResult {
  range: string;
  sheetName: string;
  rowsWritten: number;
}

export interface IExcelDriver {
  openWorkbook(path: string): Promise<WorkbookInfo>;
  getSheets(): Promise<SheetInfo[]>;
  insertTable(
    model: TableModel,
    sheetName: string,
    startCell: string
  ): Promise<InsertResult>;
  commitTransaction(): Promise<void>;
  rollback(): Promise<void>;
  snapshot(): Promise<string>;
  close(): Promise<void>;
}
