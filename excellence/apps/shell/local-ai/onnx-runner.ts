import type { IModelRunner, ModelOpts } from './IModelRunner';

export class OnnxRunner implements IModelRunner {
	async generate(_prompt: string, _opts?: ModelOpts): Promise<string> {
		try {
			return '__onnx_stub__';
		} catch (err) {
			throw new Error(`ONNX runner failed: ${String(err)}`);
		}
	}
}
