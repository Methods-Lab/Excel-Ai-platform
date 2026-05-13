import type { ExtractionInput, InputModality } from '../models/ExtractionJob';

export class InputClassifier {
	classify(input: ExtractionInput): InputModality {
		return input.type === 'mixed' ? 'mixed' : input.type;
	}
}
