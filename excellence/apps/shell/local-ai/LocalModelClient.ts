import type { IModelRunner, ModelOpts } from './IModelRunner';
import { LlamaRunner } from './llama-runner';
import { OnnxRunner } from './onnx-runner';

export class LocalModelClient {
  private primary: IModelRunner;
  private fallback: IModelRunner;

  constructor(primary?: IModelRunner, fallback?: IModelRunner) {
    this.primary = primary ?? new LlamaRunner();
    this.fallback = fallback ?? new OnnxRunner();
  }

  async generate(prompt: string, opts?: ModelOpts): Promise<string> {
    try {
      return await this.primary.generate(prompt, opts);
    } catch (err) {
      return this.fallback.generate(prompt, opts);
    }
  }
}
