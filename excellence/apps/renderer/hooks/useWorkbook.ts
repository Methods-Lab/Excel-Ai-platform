import { useCallback } from 'react';
import { IPC_CHANNELS, type WorkbookInfo } from '@codex-excel/shared-types';
import { useWorkbookStore } from '../stores/workbookStore';
import { useIPCBridge } from './useIPCBridge';

export function useWorkbook() {
  const store = useWorkbookStore();
  const { invoke } = useIPCBridge();

  const loadWorkbook = useCallback(
    async (path?: string) => {
      store.setError(null);

      try {
        let targetPath = path;
        if (!targetPath) {
          const result = await invoke(IPC_CHANNELS.WORKBOOK_OPEN_DIALOG, {});
          if (result.canceled) {
            return null;
          }
          targetPath = result.path;
        }

        const workbook: WorkbookInfo = await invoke(IPC_CHANNELS.WORKBOOK_LOAD, {
          path: targetPath,
        });
        store.loadWorkbook(workbook);
        return workbook;
      } catch (caught) {
        const message = caught instanceof Error ? caught.message : 'Workbook load failed.';
        store.setError(message);
        throw caught;
      }
    },
    [invoke, store]
  );

  const saveWorkbook = useCallback(
    async (path?: string) => {
      const response = await invoke(IPC_CHANNELS.WORKBOOK_SAVE, { path });
      return response;
    },
    [invoke]
  );

  return {
    ...store,
    loadWorkbook,
    saveWorkbook,
  };
}
