import type { ExtractionJob } from '../models/ExtractionJob';
import type { ExtractionResult } from '../models/ExtractionResult';
import type { IExtractionPipeline } from './IExtractionPipeline';

export type ProgressCallback = (jobId: string, progress: number, message?: string) => void;

export class JobQueue {
	private pipeline: IExtractionPipeline;
	private onProgress?: ProgressCallback;

	constructor(pipeline: IExtractionPipeline, onProgress?: ProgressCallback) {
		this.pipeline = pipeline;
		this.onProgress = onProgress;
	}

	async enqueue(job: ExtractionJob): Promise<ExtractionResult> {
		this.onProgress?.(job.id, 10, 'Queued');
		const result = await this.pipeline.process(job);
		this.onProgress?.(job.id, 100, 'Complete');
		return result;
	}
}
