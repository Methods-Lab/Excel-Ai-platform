import type { ExtractionJob, TableModel, WorkbookInfo } from './models/TableModel';

export interface RendererEvents {
  'extraction:updated': ExtractionJob;
  'workbook:loaded': WorkbookInfo;
  'table:committed': TableModel;
}

export type RendererEventName = keyof RendererEvents;
