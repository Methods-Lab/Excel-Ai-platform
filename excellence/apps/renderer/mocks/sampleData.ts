import type { ChatResponse, WorkbookInfo } from '@excellence/shared-types';
import type { ExtractionResult, TableModel } from '@excellence/extraction-core';

const headers: TableModel['headers'] = [
  { name: 'Department', inferredType: 'text' },
  { name: 'Q1 Sales', inferredType: 'currency', format: '$#,##0' },
  { name: 'Q2 Sales', inferredType: 'currency', format: '$#,##0' },
  { name: 'Growth %', inferredType: 'percentage', format: '0.0%' },
];

const rows: TableModel['rows'] = [
  ['Sales', 125000, 142000, 0.136],
  ['Marketing', 89000, 95000, 0.067],
  ['Engineering', 78000, 82000, 0.051],
];

export function createMockExtractionResult(
  method: ExtractionResult['extractionMethod'] = 'ocr',
  _context?: { base64?: string; mimeType?: string; url?: string; hint?: string; content?: string }
): ExtractionResult {
  return {
    jobId: `mock-job-${method}`,
    tableModel: {
      id: `mock-table-${method}`,
      name: 'Quarterly Performance',
      sheetName: 'Sales Data',
      headers,
      rows,
      flaggedCells: [
        {
          row: 1,
          col: 2,
          rawValue: '95000',
          suggestedValue: '97500',
          confidence: 0.42,
          reason: 'Low-confidence OCR read; suggested value follows neighboring pattern.',
        },
        {
          row: 2,
          col: 1,
          rawValue: '0',
          suggestedValue: '78000',
          confidence: 0.35,
          reason: 'Cell looked blank; estimate produced from adjacent department values.',
        },
      ],
      sourceRef: method === 'cheerio' ? 'https://example.com' : 'image',
      extractedAt: Date.now(),
    },
    validationResult: {
      jobId: `mock-job-${method}`,
      passed: true,
      issues: [],
    },
    overallConfidence: 0.92,
    warnings: [],
    extractionMethod: method,
  };
}

export function createMockWorkbookInfo(
  filePath = 'C:/Users/You/Documents/Sales_Data.xlsx'
): WorkbookInfo {
  return {
    filePath,
    sheets: [
      { name: 'Sales Data', rowCount: 120, colCount: 14 },
      { name: 'Pipeline', rowCount: 42, colCount: 8 },
    ],
    lockedByExcel: false,
  };
}

export function createMockChatResponse(input: { prompt: string }): ChatResponse {
  const text = input.prompt.toLowerCase();

  if (text.includes('extract') || text.includes('image') || text.includes('url')) {
    return {
      message:
        'I can extract from an image, URL, or text prompt. Choose a source and I will prepare a preview.',
    };
  }

  if (text.includes('table')) {
    return {
      message:
        'Tell me the columns you need, or add a source document and I will infer the table schema.',
    };
  }

  return {
    message:
      'I can load a workbook, extract tables, and prepare a preview before committing any changes.',
  };
}
