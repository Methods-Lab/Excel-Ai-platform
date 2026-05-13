import type { IModelRunner, ModelOpts } from './IModelRunner';

export class LlamaRunner implements IModelRunner {
	async generate(_prompt: string, _opts?: ModelOpts): Promise<string> {
		return '__llama_stub__';
	}
}
