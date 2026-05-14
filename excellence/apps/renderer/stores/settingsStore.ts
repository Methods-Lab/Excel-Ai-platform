import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  DEFAULT_RENDERER_SETTINGS,
  type RendererSettings,
  type Theme,
} from '@excellence/shared-types';

interface SettingsActions {
  updateSetting: <K extends keyof RendererSettings>(key: K, value: RendererSettings[K]) => void;
  resetDefaults: () => void;
  toggleTheme: () => void;
}

export type SettingsStore = RendererSettings & SettingsActions;

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      ...DEFAULT_RENDERER_SETTINGS,
      updateSetting: (key, value) => set({ [key]: value } as Partial<RendererSettings>),
      resetDefaults: () => set(DEFAULT_RENDERER_SETTINGS),
      toggleTheme: () =>
        set((state) => ({
          theme: (state.theme === 'dark' ? 'light' : 'dark') as Theme,
        })),
    }),
    {
      name: 'excel-ai-renderer-settings',
      version: 1,
    }
  )
);

export const selectTheme = (state: SettingsStore) => state.theme;
export const selectExcelLocale = (state: SettingsStore) => state.excelLocale;
export const selectCloudAIEnabled = (state: SettingsStore) => state.cloudAIEnabled;
export const selectOcrThreshold = (state: SettingsStore) => state.ocrConfidenceThreshold;
export const selectAllowedUrls = (state: SettingsStore) => state.allowedUrls;
export const selectLocalModelPath = (state: SettingsStore) => state.localModelPath;
