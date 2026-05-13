export type ColumnType = 'text' | 'number' | 'currency' | 'date';

export interface ColumnDef {
  name: string;
  type: ColumnType;
  format?: string;
}

export interface RowData {
  value: string | number;
  confidence: number;
  flagged: boolean;
  suggestedFix?: string | number;
}

export interface TableModel {
  id: string;
  columns: ColumnDef[];
  rows: RowData[][];
  sheetName?: string;
  tableName?: string;
}

export interface FlaggedCell {
  row: number;
  col: number;
  currentValue: string;
  suggestedFix: string;
  reason: string;
}

export type ExtractionSource = 'image' | 'url' | 'text' | 'document';

export interface ExtractionResult {
  source: ExtractionSource;
  table: TableModel;
  overallConfidence: number;
  flaggedCells: FlaggedCell[];
}

export interface SheetInfo {
  name: string;
  tables: TableModel[];
}

export interface WorkbookInfo {
  path: string;
  sheets: SheetInfo[];
}

export interface CellAddress {
  row: number;
  col: number;
}

export type ChatRole = 'user' | 'assistant';

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string | ExtractionResult;
  timestamp: number;
}

export type ExtractionStatus = 'idle' | 'processing' | 'preview' | 'committed' | 'failed';

export interface ExtractionJob {
  id: string;
  source: ExtractionSource;
  status: ExtractionStatus;
  progress: number;
  message?: string;
  error?: string;
  result?: ExtractionResult;
}
