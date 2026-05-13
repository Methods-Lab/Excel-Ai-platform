import type { TableModel } from './TableModel';
import type { ValidationResult } from './ValidationResult';

export interface ExtractionResult {
  jobId: string;
  tableModel: TableModel;
  validationResult: ValidationResult;
  overallConfidence: number;
  warnings: string[];
  extractionMethod:
    | 'ocr'
    | 'cheerio'
    | 'playwright'
    | 'relay'
    | 'paste'
    | 'text'
    | 'gemini';
}
