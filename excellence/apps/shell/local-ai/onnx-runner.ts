import type { IModelRunner, ModelOpts } from './IModelRunner';

export class OnnxRunner implements IModelRunner {
	async generate(_prompt: string, _opts?: ModelOpts): Promise<string> {
		return '__onnx_stub__';
	}
}
