export type Theme = 'light' | 'dark' | 'system';

export interface RendererSettings {
  theme: Theme;
  excelLocale: string;
  cloudAIEnabled: boolean;
  ocrConfidenceThreshold: number;
}

export const DEFAULT_RENDERER_SETTINGS: RendererSettings = {
  theme: 'light',
  excelLocale: 'en-US',
  cloudAIEnabled: false,
  ocrConfidenceThreshold: 85,
};
