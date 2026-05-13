export type InferredType =
	| 'text'
	| 'number'
	| 'currency'
	| 'date'
	| 'percentage'
	| 'boolean';

export interface ColumnSchema {
	name: string;
	inferredType: InferredType;
	format?: string;
}

export interface FlaggedCell {
	row: number;
	col: number;
	rawValue: string;
	suggestedValue: string;
	confidence: number;
	reason: string;
}

export interface CellData {
	text: string;
	confidence: number;
	bbox: [number, number, number, number];
}

export interface TableModel {
	id: string;
	name: string;
	sheetName: string;
	headers: ColumnSchema[];
	rows: Array<Array<string | number | boolean | null>>;
	flaggedCells: FlaggedCell[];
	sourceRef: string;
	extractedAt: number;
}
