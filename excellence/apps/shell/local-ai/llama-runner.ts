import type { IModelRunner, ModelOpts } from './IModelRunner';

export class LlamaRunner implements IModelRunner {
	async generate(_prompt: string, _opts?: ModelOpts): Promise<string> {
		try {
			return '__llama_stub__';
		} catch (err) {
			throw new Error(`Llama runner failed: ${String(err)}`);
		}
	}
}
