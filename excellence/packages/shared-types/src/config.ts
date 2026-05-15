export const API_PORT = 8745 as const;
export const OCR_PORT = 5555 as const;
export const API_BASE_URL = `http://localhost:${API_PORT}` as const;
export const OCR_BASE_URL = `http://localhost:${OCR_PORT}` as const;
export const getRelayPort = (): number =>
  Math.floor(10000 + Math.random() * 50000);
export const RELAY_PORT = getRelayPort;

export type AppEnv = 'development' | 'production';

export interface AppConfig {
  env: AppEnv;
  groqModel: string;
  useLocalAI: boolean;
  localModelPath?: string;
  ocrConfidenceThreshold: number;
}

export type Theme = 'light' | 'dark' | 'system';

export interface RendererSettings {
  theme: Theme;
  excelLocale: string;
  cloudAIEnabled: boolean;
  ocrConfidenceThreshold: number;
  allowedUrls: string[];
  localModelPath?: string;
}

export const DEFAULT_RENDERER_SETTINGS: RendererSettings = {
  theme: 'light',
  excelLocale: 'en-US',
  cloudAIEnabled: false,
  ocrConfidenceThreshold: 0.75,
  allowedUrls: [],
  localModelPath: undefined,
};
