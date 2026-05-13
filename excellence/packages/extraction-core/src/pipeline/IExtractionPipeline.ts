import type { ExtractionJob } from '../models/ExtractionJob';
import type { ExtractionResult } from '../models/ExtractionResult';

export interface IExtractionPipeline {
  process(job: ExtractionJob): Promise<ExtractionResult>;
}
