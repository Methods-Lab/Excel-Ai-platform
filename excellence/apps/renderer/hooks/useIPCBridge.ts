import { useCallback, useMemo } from 'react';
import {
  IPC_CHANNELS,
  type ChatSendRequest,
  type ExtractFromDocumentRequest,
  type IPCChannel,
  type IPCRequestMap,
  type IPCResponseMap,
  type TableCommitRequest,
  type TablePreviewRequest,
  type WorkbookLoadRequest,
  type WorkbookSaveRequest,
} from '@codex-excel/shared-types';

interface ElectronAPI {
  invoke: <TRequest, TResponse>(channel: string, payload: TRequest) => Promise<TResponse>;
  on: (channel: string, callback: (data: unknown) => void) => () => void;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

const MOCK_IPC_ENABLED = import.meta.env.VITE_ENABLE_MOCK_IPC === 'true';

const shellNotReadyMessage =
  'Shell handler not implemented or Electron preload unavailable. Enable VITE_ENABLE_MOCK_IPC=true for local renderer dev mode.';

const delay = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

async function invokeMock<C extends IPCChannel>(
  channel: C,
  payload: IPCRequestMap[C]
): Promise<IPCResponseMap[C]> {
  const mocks = await import('../mocks/sampleData');

  switch (channel) {
    case IPC_CHANNELS.EXTRACT_FROM_IMAGE:
      await delay(900);
      return mocks.createMockExtractionResult('image') as IPCResponseMap[C];
    case IPC_CHANNELS.EXTRACT_FROM_URL:
      await delay(1000);
      return mocks.createMockExtractionResult('url') as IPCResponseMap[C];
    case IPC_CHANNELS.EXTRACT_FROM_TEXT:
      await delay(700);
      return mocks.createMockExtractionResult('text') as IPCResponseMap[C];
    case IPC_CHANNELS.EXTRACT_FROM_DOCUMENT: {
      await delay(1100);
      const request = payload as ExtractFromDocumentRequest;
      const result = mocks.createMockExtractionResult('document');
      return {
        ...result,
        table: {
          ...result.table,
          tableName: request.fileName.replace(/\.[^.]+$/, '') || result.table.tableName,
        },
      } as IPCResponseMap[C];
    }
    case IPC_CHANNELS.WORKBOOK_OPEN_DIALOG:
      return { canceled: false, path: 'C:/Users/You/Documents/Sales_Data.xlsx' } as IPCResponseMap[C];
    case IPC_CHANNELS.WORKBOOK_LOAD: {
      const request = payload as WorkbookLoadRequest;
      await delay(350);
      return mocks.createMockWorkbookInfo(request.path) as IPCResponseMap[C];
    }
    case IPC_CHANNELS.WORKBOOK_SAVE: {
      const request = payload as WorkbookSaveRequest;
      return { success: true, path: request.path ?? 'C:/Users/You/Documents/Sales_Data.xlsx' } as IPCResponseMap[C];
    }
    case IPC_CHANNELS.TABLE_COMMIT: {
      const request = payload as TableCommitRequest;
      const colLetter = String.fromCharCode(64 + request.table.columns.length);
      const lastRow = request.table.rows.length + 1;
      return {
        success: true,
        sheetName: request.sheetName,
        range: `A1:${colLetter}${lastRow}`,
      } as IPCResponseMap[C];
    }
    case IPC_CHANNELS.TABLE_PREVIEW: {
      const request = payload as TablePreviewRequest;
      return {
        rowCount: request.table.rows.length,
        colCount: request.table.columns.length,
      } as IPCResponseMap[C];
    }
    case IPC_CHANNELS.RELAY_STATUS:
      return {
        jobId: (payload as { jobId: string }).jobId,
        status: 'processing',
        progress: 50,
        message: 'Processing in mock mode',
      } as IPCResponseMap[C];
    case IPC_CHANNELS.CHAT_SEND:
      await delay(500);
      return mocks.createMockChatResponse(payload as ChatSendRequest) as IPCResponseMap[C];
    default:
      throw new Error(`No mock handler for channel: ${channel}`);
  }
}

export function useIPCBridge() {
  const isElectron = typeof window !== 'undefined' && Boolean(window.electronAPI);

  const invoke = useCallback(
    async <C extends IPCChannel>(
      channel: C,
      payload: IPCRequestMap[C]
    ): Promise<IPCResponseMap[C]> => {
      if (isElectron && window.electronAPI) {
        return window.electronAPI.invoke<IPCRequestMap[C], IPCResponseMap[C]>(channel, payload);
      }

      if (MOCK_IPC_ENABLED) {
        return invokeMock(channel, payload);
      }

      throw new Error(shellNotReadyMessage);
    },
    [isElectron]
  );

  const on = useCallback(
    (channel: IPCChannel, callback: (data: unknown) => void) => {
      if (isElectron && window.electronAPI) {
        return window.electronAPI.on(channel, callback);
      }

      if (MOCK_IPC_ENABLED) {
        return () => undefined;
      }

      throw new Error(`Cannot subscribe to ${channel}. ${shellNotReadyMessage}`);
    },
    [isElectron]
  );

  return useMemo(
    () => ({
      invoke,
      on,
      isElectron,
      isMockMode: MOCK_IPC_ENABLED,
      shellNotReadyMessage,
    }),
    [invoke, isElectron, on]
  );
}
