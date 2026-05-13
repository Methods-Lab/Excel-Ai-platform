export interface OCRCell {
	text: string;
	confidence: number;
	bbox: [number, number, number, number];
	row: number;
	col: number;
}

export interface OCRResult {
	cells: OCRCell[];
	processingTimeMs?: number;
}

export interface OCREngine {
	recognize(imageBuffer: Uint8Array): Promise<OCRResult>;
}
