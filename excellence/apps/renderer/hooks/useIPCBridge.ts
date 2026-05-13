import { useMemo } from 'react';
import type {
  ChatResponse,
  CommitResult,
  IChatService,
  IExtractionService,
  IWorkbookService,
  WorkbookInfo,
} from '@codex-excel/shared-types';
import type { IpcChannel, IpcResponse } from '@codex-excel/shared-types';
import type { ExtractionResult, TableModel } from '@excel-ai-platform/extraction-core';
import {
  createMockChatResponse,
  createMockExtractionResult,
  createMockWorkbookInfo,
} from '../mocks/sampleData';

interface ElectronAPI {
  chat: {
    send: (prompt: string) => Promise<IpcResponse<ChatResponse>>;
  };
  extract: {
    fromImage: (base64: string, mimeType: string) => Promise<IpcResponse<ExtractionResult>>;
    fromUrl: (url: string, hint?: string) => Promise<IpcResponse<ExtractionResult>>;
    fromText: (content: string) => Promise<IpcResponse<ExtractionResult>>;
  };
  workbook: {
    load: (filePath: string) => Promise<IpcResponse<WorkbookInfo>>;
    commit: (tableModel: TableModel) => Promise<IpcResponse<CommitResult>>;
    rollback: () => Promise<IpcResponse<void>>;
    snapshot: () => Promise<IpcResponse<string>>;
  };
  on: (
    channel: IpcChannel,
    listener: (response: IpcResponse<unknown>) => void
  ) => () => void;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

const MOCK_IPC_ENABLED = import.meta.env.VITE_ENABLE_MOCK_IPC === 'true';

const delay = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

const unwrap = <T>(response: IpcResponse<T>): T => {
  if (!response.success) {
    throw new Error(response.error?.message ?? 'IPC request failed.');
  }
  if (response.data === undefined) {
    throw new Error('IPC response missing data.');
  }
  return response.data;
};

const createMockBridge = (): IChatService &
  IExtractionService &
  IWorkbookService & { on: ElectronAPI['on'] } => ({
  send: async (prompt: string) => {
    await delay(600);
    return createMockChatResponse({ prompt });
  },
  fromImage: async (base64: string, mimeType: string) => {
    await delay(2000);
    return createMockExtractionResult('ocr', { base64, mimeType });
  },
  fromUrl: async (url: string, hint?: string) => {
    await delay(2200);
    return createMockExtractionResult('cheerio', { url, hint });
  },
  fromText: async (content: string) => {
    await delay(1800);
    return createMockExtractionResult('text', { content });
  },
  load: async (filePath: string) => {
    await delay(500);
    return createMockWorkbookInfo(filePath);
  },
  commit: async (tableModel: TableModel) => {
    await delay(800);
    const colLetter = String.fromCharCode(64 + tableModel.headers.length);
    const lastRow = tableModel.rows.length + 1;
    return {
      range: `A1:${colLetter}${lastRow}`,
      sheetName: tableModel.sheetName,
      rowsWritten: tableModel.rows.length,
    };
  },
  rollback: async () => {
    await delay(300);
  },
  snapshot: async () => {
    await delay(300);
    return 'C:/Users/You/Documents/Workbook_Snapshot.xlsx';
  },
  on: () => () => undefined,
});

export function useIPCBridge():
  IChatService & IExtractionService & IWorkbookService & { on: ElectronAPI['on'] } {
  const isElectron = typeof window !== 'undefined' && !!window.electronAPI;

  return useMemo(() => {
    if (isElectron && window.electronAPI) {
      return {
        send: async (prompt: string) => unwrap(await window.electronAPI.chat.send(prompt)),
        fromImage: async (base64: string, mimeType: string) =>
          unwrap(await window.electronAPI.extract.fromImage(base64, mimeType)),
        fromUrl: async (url: string, hint?: string) =>
          unwrap(await window.electronAPI.extract.fromUrl(url, hint)),
        fromText: async (content: string) =>
          unwrap(await window.electronAPI.extract.fromText(content)),
        load: async (filePath: string) =>
          unwrap(await window.electronAPI.workbook.load(filePath)),
        commit: async (tableModel: TableModel) =>
          unwrap(await window.electronAPI.workbook.commit(tableModel)),
        rollback: async () => unwrap(await window.electronAPI.workbook.rollback()),
        snapshot: async () => unwrap(await window.electronAPI.workbook.snapshot()),
        on: window.electronAPI.on,
      };
    }

    if (MOCK_IPC_ENABLED) {
      return createMockBridge();
    }

    return createMockBridge();
  }, [isElectron]);
}
