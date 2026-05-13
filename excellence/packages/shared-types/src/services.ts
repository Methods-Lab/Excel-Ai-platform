import type { TableModel } from '@excel-ai-platform/extraction-core';
import type { ExtractionResult } from '@excel-ai-platform/extraction-core';

export interface ChatResponse {
  message: string;
  tableModel?: TableModel;
}

export type ChatRole = 'user' | 'assistant';

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string | ExtractionResult;
  timestamp: number;
}

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

export interface CommitResult {
  range: string;
  sheetName: string;
  rowsWritten: number;
}

export interface ConsentDeniedError {
  code: 'CONSENT_DENIED';
  action: string;
  timestamp: number;
}

export interface IChatService {
  send(prompt: string): Promise<ChatResponse>;
}

export interface IExtractionService {
  fromImage(base64: string, mimeType: string): Promise<ExtractionResult>;
  fromUrl(url: string, hint?: string): Promise<ExtractionResult>;
  fromText(content: string): Promise<ExtractionResult>;
}

export interface IWorkbookService {
  load(filePath: string): Promise<WorkbookInfo>;
  commit(tableModel: TableModel): Promise<CommitResult>;
  rollback(): Promise<void>;
  snapshot(): Promise<string>;
}
