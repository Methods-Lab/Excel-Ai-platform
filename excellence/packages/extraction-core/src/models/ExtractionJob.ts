export type InputModality = 'text' | 'image' | 'url' | 'mixed';
export type ExtractionPhase = 'phase1' | 'phase2' | 'phase3';
export type JobStatus =
	| 'queued'
	| 'processing'
	| 'awaiting_preview'
	| 'committed'
	| 'failed'
	| 'cancelled';

export interface TextInput {
	type: 'text';
	content: string;
}

export interface ImageInput {
	type: 'image';
	base64: string;
	mimeType: 'image/png' | 'image/jpeg' | 'image/webp';
}

export interface UrlInput {
	type: 'url';
	url: string;
	tableHint?: string;
}

export interface MixedInput {
	type: 'mixed';
	inputs: Array<TextInput | ImageInput | UrlInput>;
}

export type ExtractionInput = TextInput | ImageInput | UrlInput | MixedInput;

export interface ExtractionJob {
	id: string;
	modality: InputModality;
	phase: ExtractionPhase;
	status: JobStatus;
	priority: number;
	input: ExtractionInput;
	result?: import('./ExtractionResult').ExtractionResult;
	error?: ExtractionError;
	createdAt: number;
	updatedAt: number;
}

export interface ExtractionError {
	code: string;
	message: string;
	recoverable: boolean;
}
