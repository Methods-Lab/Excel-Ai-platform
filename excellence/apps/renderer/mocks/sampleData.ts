import type {
  ChatSendRequest,
  ExtractionResult,
  ExtractionSource,
  WorkbookInfo,
} from '@codex-excel/shared-types';

const columns = [
  { name: 'Department', type: 'text' as const },
  { name: 'Q1 Sales', type: 'currency' as const, format: '$#,##0' },
  { name: 'Q2 Sales', type: 'currency' as const, format: '$#,##0' },
  { name: 'Growth %', type: 'number' as const, format: '0.0%' },
];

const rows = [
  [
    { value: 'Sales', confidence: 99, flagged: false },
    { value: 125000, confidence: 98, flagged: false },
    { value: 142000, confidence: 97, flagged: false },
    { value: 0.136, confidence: 95, flagged: false },
  ],
  [
    { value: 'Marketing', confidence: 99, flagged: false },
    { value: 89000, confidence: 98, flagged: false },
    { value: 95000, confidence: 45, flagged: true, suggestedFix: 97500 },
    { value: 0.067, confidence: 92, flagged: false },
  ],
  [
    { value: 'Engineering', confidence: 97, flagged: false },
    { value: 0, confidence: 30, flagged: true, suggestedFix: 78000 },
    { value: 82000, confidence: 96, flagged: false },
    { value: 0.051, confidence: 88, flagged: false },
  ],
];

export function createMockExtractionResult(
  source: ExtractionSource = 'image'
): ExtractionResult {
  return {
    source,
    table: {
      id: `mock-table-${source}`,
      columns,
      rows,
      sheetName: 'Sales Data',
      tableName:
        source === 'document' ? 'Document Extracted Performance' : 'Quarterly Performance',
    },
    overallConfidence: 92,
    flaggedCells: [
      {
        row: 1,
        col: 2,
        currentValue: '95000',
        suggestedFix: '97500',
        reason: "Low-confidence OCR read; suggested value follows neighboring pattern.",
      },
      {
        row: 2,
        col: 1,
        currentValue: '0',
        suggestedFix: '78000',
        reason: 'Cell looked blank; estimate produced from adjacent department values.',
      },
    ],
  };
}

export function createMockWorkbookInfo(path = 'C:/Users/You/Documents/Sales_Data.xlsx'): WorkbookInfo {
  return {
    path,
    sheets: [
      {
        name: 'Sales Data',
        tables: [
          {
            ...createMockExtractionResult('document').table,
            id: 'mock-table-loaded',
            tableName: 'Quarterly Performance',
          },
        ],
      },
      {
        name: 'Pipeline',
        tables: [],
      },
    ],
  };
}

export function createMockChatResponse(request: ChatSendRequest) {
  const text = request.text.toLowerCase();

  if (text.includes('document') || text.includes('pdf') || text.includes('file')) {
    return {
      text: 'Use Add document to pick a file, then I can extract structured rows for review before committing them to Excel.',
    };
  }

  if (text.includes('extract') || text.includes('image') || text.includes('url')) {
    return {
      text: 'I can extract from an image, URL, text prompt, or document. Choose an option below and I will prepare a preview first.',
    };
  }

  if (text.includes('table')) {
    return {
      text: 'Tell me the columns you need, or add a source document and I will infer the table schema before writing to the workbook.',
    };
  }

  return {
    text: 'I am ready to help with workbook loading, document extraction, table cleanup, and committing reviewed data to Excel.',
  };
}
