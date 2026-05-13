import type { ExtractionInput, ExtractionJob } from '../models/ExtractionJob';
import type { ExtractionResult } from '../models/ExtractionResult';
import type { TableModel } from '../models/TableModel';
import type { ValidationResult } from '../models/ValidationResult';
import type { IExtractionPipeline } from './IExtractionPipeline';

const defaultHeaders: TableModel['headers'] = [
	{ name: 'Item', inferredType: 'text' },
	{ name: 'Quantity', inferredType: 'number' },
	{ name: 'Price', inferredType: 'currency', format: '$#,##0.00' },
];

const defaultRows: TableModel['rows'] = [
	['Apples', 12, 3.5],
	['Oranges', 8, 4.25],
	['Bananas', 16, 2.1],
];

const buildSourceRef = (input: ExtractionInput): string => {
	switch (input.type) {
		case 'url':
			return input.url;
		case 'image':
			return 'image';
		case 'text':
			return 'text-prompt';
		case 'mixed':
			return 'mixed';
		default:
			return 'unknown';
	}
};

const buildExtractionMethod = (
	input: ExtractionInput
): ExtractionResult['extractionMethod'] => {
	switch (input.type) {
		case 'image':
			return 'ocr';
		case 'url':
			return 'cheerio';
		case 'text':
			return 'text';
		case 'mixed':
			return 'gemini';
		default:
			return 'text';
	}
};

const buildTableModel = (job: ExtractionJob): TableModel => {
	return {
		id: `table-${job.id}`,
		name: 'Table_Extraction_Preview',
		sheetName: 'Sheet1',
		headers: defaultHeaders,
		rows: defaultRows,
		flaggedCells: [],
		sourceRef: buildSourceRef(job.input),
		extractedAt: Date.now(),
	};
};

const buildValidationResult = (jobId: string): ValidationResult => ({
	jobId,
	passed: true,
	issues: [],
});

export class ExtractionPipeline implements IExtractionPipeline {
	async process(job: ExtractionJob): Promise<ExtractionResult> {
		const tableModel = buildTableModel(job);
		const validationResult = buildValidationResult(job.id);
		return {
			jobId: job.id,
			tableModel,
			validationResult,
			overallConfidence: 0.92,
			warnings: [],
			extractionMethod: buildExtractionMethod(job.input),
		};
	}
}
