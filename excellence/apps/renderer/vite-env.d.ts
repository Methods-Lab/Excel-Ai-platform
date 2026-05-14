/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ENABLE_MOCK_IPC?: string;
  readonly VITE_AI_HOST?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
