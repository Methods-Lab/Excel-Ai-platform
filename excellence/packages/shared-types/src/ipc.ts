import { z } from 'zod';
import type { ExtractionResult, TableModel, WorkbookInfo } from './models/TableModel';

export * from './models/TableModel';

export const CellAddressSchema = z.object({
  row: z.number().int().min(0),
  col: z.number().int().min(0),
});

export const ColumnDefSchema = z.object({
  name: z.string(),
  type: z.enum(['text', 'number', 'currency', 'date']),
  format: z.string().optional(),
});

export const RowDataSchema = z.object({
  value: z.union([z.string(), z.number()]),
  confidence: z.number().min(0).max(100),
  flagged: z.boolean(),
  suggestedFix: z.union([z.string(), z.number()]).optional(),
});

export const TableModelSchema: z.ZodType<TableModel> = z.object({
  id: z.string(),
  columns: z.array(ColumnDefSchema),
  rows: z.array(z.array(RowDataSchema)),
  sheetName: z.string().optional(),
  tableName: z.string().optional(),
});

export const FlaggedCellSchema = z.object({
  row: z.number().int().min(0),
  col: z.number().int().min(0),
  currentValue: z.string(),
  suggestedFix: z.string(),
  reason: z.string(),
});

export const ExtractionResultSchema: z.ZodType<ExtractionResult> = z.object({
  source: z.enum(['image', 'url', 'text', 'document']),
  table: TableModelSchema,
  overallConfidence: z.number().min(0).max(100),
  flaggedCells: z.array(FlaggedCellSchema),
});

export const WorkbookInfoSchema: z.ZodType<WorkbookInfo> = z.object({
  path: z.string(),
  sheets: z.array(
    z.object({
      name: z.string(),
      tables: z.array(TableModelSchema),
    })
  ),
});

export const ExtractFromImageRequestSchema = z.object({
  imageBase64: z.string(),
  sheetName: z.string().optional(),
});
export const ExtractFromImageResponseSchema = ExtractionResultSchema;

export const ExtractFromURLRequestSchema = z.object({
  url: z.string().url(),
  sheetName: z.string().optional(),
});
export const ExtractFromURLResponseSchema = ExtractionResultSchema;

export const ExtractFromTextRequestSchema = z.object({
  prompt: z.string().min(1),
  sheetName: z.string().optional(),
});
export const ExtractFromTextResponseSchema = ExtractionResultSchema;

export const ExtractFromDocumentRequestSchema = z.object({
  fileName: z.string(),
  fileBase64: z.string(),
  mimeType: z.string().optional(),
  sheetName: z.string().optional(),
});
export const ExtractFromDocumentResponseSchema = ExtractionResultSchema;

export const WorkbookOpenDialogRequestSchema = z.object({}).optional();
export const WorkbookOpenDialogResponseSchema = z.object({
  canceled: z.boolean(),
  path: z.string().optional(),
});

export const WorkbookLoadRequestSchema = z.object({
  path: z.string().optional(),
});
export const WorkbookLoadResponseSchema = WorkbookInfoSchema;

export const WorkbookSaveRequestSchema = z.object({
  path: z.string().optional(),
});
export const WorkbookSaveResponseSchema = z.object({
  success: z.boolean(),
  path: z.string(),
});

export const TableCommitRequestSchema = z.object({
  sheetName: z.string(),
  table: TableModelSchema,
  position: CellAddressSchema,
  overwriteExisting: z.boolean().default(false),
});
export const TableCommitResponseSchema = z.object({
  success: z.boolean(),
  sheetName: z.string(),
  range: z.string(),
});

export const TablePreviewRequestSchema = z.object({
  table: TableModelSchema,
});
export const TablePreviewResponseSchema = z.object({
  htmlPreview: z.string().optional(),
  rowCount: z.number(),
  colCount: z.number(),
});

export const RelayStatusRequestSchema = z.object({
  jobId: z.string(),
});
export const RelayStatusResponseSchema = z.object({
  jobId: z.string(),
  status: z.enum(['idle', 'processing', 'preview', 'committed', 'failed']),
  progress: z.number().min(0).max(100),
  message: z.string().optional(),
});

export const ChatSendRequestSchema = z.object({
  text: z.string().min(1),
});
export const ChatSendResponseSchema = z.object({
  text: z.string(),
});

export type ExtractFromImageRequest = z.infer<typeof ExtractFromImageRequestSchema>;
export type ExtractFromImageResponse = z.infer<typeof ExtractFromImageResponseSchema>;
export type ExtractFromURLRequest = z.infer<typeof ExtractFromURLRequestSchema>;
export type ExtractFromURLResponse = z.infer<typeof ExtractFromURLResponseSchema>;
export type ExtractFromTextRequest = z.infer<typeof ExtractFromTextRequestSchema>;
export type ExtractFromTextResponse = z.infer<typeof ExtractFromTextResponseSchema>;
export type ExtractFromDocumentRequest = z.infer<typeof ExtractFromDocumentRequestSchema>;
export type ExtractFromDocumentResponse = z.infer<typeof ExtractFromDocumentResponseSchema>;
export type WorkbookOpenDialogRequest = z.infer<typeof WorkbookOpenDialogRequestSchema>;
export type WorkbookOpenDialogResponse = z.infer<typeof WorkbookOpenDialogResponseSchema>;
export type WorkbookLoadRequest = z.infer<typeof WorkbookLoadRequestSchema>;
export type WorkbookLoadResponse = z.infer<typeof WorkbookLoadResponseSchema>;
export type WorkbookSaveRequest = z.infer<typeof WorkbookSaveRequestSchema>;
export type WorkbookSaveResponse = z.infer<typeof WorkbookSaveResponseSchema>;
export type TableCommitRequest = z.infer<typeof TableCommitRequestSchema>;
export type TableCommitResponse = z.infer<typeof TableCommitResponseSchema>;
export type TablePreviewRequest = z.infer<typeof TablePreviewRequestSchema>;
export type TablePreviewResponse = z.infer<typeof TablePreviewResponseSchema>;
export type RelayStatusRequest = z.infer<typeof RelayStatusRequestSchema>;
export type RelayStatusResponse = z.infer<typeof RelayStatusResponseSchema>;
export type ChatSendRequest = z.infer<typeof ChatSendRequestSchema>;
export type ChatSendResponse = z.infer<typeof ChatSendResponseSchema>;

export const IPC_CHANNELS = {
  EXTRACT_FROM_IMAGE: 'extract:from-image',
  EXTRACT_FROM_URL: 'extract:from-url',
  EXTRACT_FROM_TEXT: 'extract:from-text',
  EXTRACT_FROM_DOCUMENT: 'extract:from-document',
  WORKBOOK_OPEN_DIALOG: 'workbook:open-dialog',
  WORKBOOK_LOAD: 'workbook:load',
  WORKBOOK_SAVE: 'workbook:save',
  TABLE_COMMIT: 'table:commit',
  TABLE_PREVIEW: 'table:preview',
  RELAY_STATUS: 'relay:status',
  CHAT_SEND: 'chat:send',
} as const;

export type IPCChannel = (typeof IPC_CHANNELS)[keyof typeof IPC_CHANNELS];

export interface IPCRequestMap {
  [IPC_CHANNELS.EXTRACT_FROM_IMAGE]: ExtractFromImageRequest;
  [IPC_CHANNELS.EXTRACT_FROM_URL]: ExtractFromURLRequest;
  [IPC_CHANNELS.EXTRACT_FROM_TEXT]: ExtractFromTextRequest;
  [IPC_CHANNELS.EXTRACT_FROM_DOCUMENT]: ExtractFromDocumentRequest;
  [IPC_CHANNELS.WORKBOOK_OPEN_DIALOG]: WorkbookOpenDialogRequest;
  [IPC_CHANNELS.WORKBOOK_LOAD]: WorkbookLoadRequest;
  [IPC_CHANNELS.WORKBOOK_SAVE]: WorkbookSaveRequest;
  [IPC_CHANNELS.TABLE_COMMIT]: TableCommitRequest;
  [IPC_CHANNELS.TABLE_PREVIEW]: TablePreviewRequest;
  [IPC_CHANNELS.RELAY_STATUS]: RelayStatusRequest;
  [IPC_CHANNELS.CHAT_SEND]: ChatSendRequest;
}

export interface IPCResponseMap {
  [IPC_CHANNELS.EXTRACT_FROM_IMAGE]: ExtractFromImageResponse;
  [IPC_CHANNELS.EXTRACT_FROM_URL]: ExtractFromURLResponse;
  [IPC_CHANNELS.EXTRACT_FROM_TEXT]: ExtractFromTextResponse;
  [IPC_CHANNELS.EXTRACT_FROM_DOCUMENT]: ExtractFromDocumentResponse;
  [IPC_CHANNELS.WORKBOOK_OPEN_DIALOG]: WorkbookOpenDialogResponse;
  [IPC_CHANNELS.WORKBOOK_LOAD]: WorkbookLoadResponse;
  [IPC_CHANNELS.WORKBOOK_SAVE]: WorkbookSaveResponse;
  [IPC_CHANNELS.TABLE_COMMIT]: TableCommitResponse;
  [IPC_CHANNELS.TABLE_PREVIEW]: TablePreviewResponse;
  [IPC_CHANNELS.RELAY_STATUS]: RelayStatusResponse;
  [IPC_CHANNELS.CHAT_SEND]: ChatSendResponse;
}
