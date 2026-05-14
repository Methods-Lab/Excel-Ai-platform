import { useCallback } from 'react';
import type { WorkbookInfo } from '@excellence/shared-types';
import { useWorkbookStore } from '../stores/workbookStore';
import { useIPCBridge } from './useIPCBridge';

export function useWorkbook() {
  const store = useWorkbookStore();
  const { load } = useIPCBridge();

  const loadWorkbook = useCallback(
    async (path?: string) => {
      store.setError(null);

      try {
        if (!path) {
          throw new Error('File path is required to load a workbook.');
        }

        const workbook: WorkbookInfo = await load(path);
        store.loadWorkbook(workbook);
        return workbook;
      } catch (caught) {
        const message = caught instanceof Error ? caught.message : 'Workbook load failed.';
        store.setError(message);
        throw caught;
      }
    },
    [load, store]
  );

  return {
    ...store,
    loadWorkbook,
  };
}
