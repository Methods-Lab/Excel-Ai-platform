export interface ModelOpts {
  maxTokens?: number;
  temperature?: number;
  topP?: number;
}

export interface IModelRunner {
  generate(prompt: string, opts?: ModelOpts): Promise<string>;
}
