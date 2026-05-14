import { useMemo } from 'react';
import type {
  ChatResponse,
  CommitResult,
  IChatService,
  IExtractionService,
  IWorkbookService,
  WorkbookInfo,
} from '@excellence/shared-types';
import type { IpcChannel, IpcResponse } from '@excellence/shared-types';
import type { ExtractionResult, TableModel } from '@excellence/extraction-core';
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
    try {
      await delay(600);
      return createMockChatResponse({ prompt });
    } catch (err) {
      throw new Error(`Mock chat failed: ${String(err)}`);
    }
  },
  fromImage: async (base64: string, mimeType: string) => {
    try {
      await delay(2200);
      return createMockExtractionResult('ocr', { base64, mimeType });
    } catch (err) {
      throw new Error(`Mock image extraction failed: ${String(err)}`);
    }
  },
  fromUrl: async (url: string, hint?: string) => {
    try {
      await delay(2400);
      return createMockExtractionResult('cheerio', { url, hint });
    } catch (err) {
      throw new Error(`Mock URL extraction failed: ${String(err)}`);
    }
  },
  fromText: async (content: string) => {
    try {
      await delay(2100);
      return createMockExtractionResult('text', { content });
    } catch (err) {
      throw new Error(`Mock text extraction failed: ${String(err)}`);
    }
  },
  load: async (filePath: string) => {
    try {
      await delay(500);
      return createMockWorkbookInfo(filePath);
    } catch (err) {
      throw new Error(`Mock workbook load failed: ${String(err)}`);
    }
  },
  commit: async (tableModel: TableModel) => {
    try {
      await delay(800);
      const colLetter = String.fromCharCode(64 + tableModel.headers.length);
      const lastRow = tableModel.rows.length + 1;
      return {
        range: `A1:${colLetter}${lastRow}`,
        sheetName: tableModel.sheetName,
        rowsWritten: tableModel.rows.length,
      };
    } catch (err) {
      throw new Error(`Mock workbook commit failed: ${String(err)}`);
    }
  },
  rollback: async () => {
    try {
      await delay(300);
    } catch (err) {
      throw new Error(`Mock workbook rollback failed: ${String(err)}`);
    }
  },
  snapshot: async () => {
    try {
      await delay(300);
      return 'C:/Users/You/Documents/Workbook_Snapshot.xlsx';
    } catch (err) {
      throw new Error(`Mock workbook snapshot failed: ${String(err)}`);
    }
  },
  on: () => () => undefined,
});

export function useIPCBridge():
  IChatService & IExtractionService & IWorkbookService & { on: ElectronAPI['on'] } {
  const isElectron = typeof window !== 'undefined' && !!window.electronAPI;

  return useMemo(() => {
    if (isElectron && window.electronAPI) {
      return {
      send: async (prompt: string) => {
        try {
          return unwrap(await window.electronAPI.chat.send(prompt));
        } catch (err) {
          throw new Error(`Chat IPC failed: ${String(err)}`);
        }
      },
      fromImage: async (base64: string, mimeType: string) => {
        try {
          return unwrap(await window.electronAPI.extract.fromImage(base64, mimeType));
        } catch (err) {
          throw new Error(`Image IPC failed: ${String(err)}`);
        }
      },
      fromUrl: async (url: string, hint?: string) => {
        try {
          return unwrap(await window.electronAPI.extract.fromUrl(url, hint));
        } catch (err) {
          throw new Error(`URL IPC failed: ${String(err)}`);
        }
      },
      fromText: async (content: string) => {
        try {
          return unwrap(await window.electronAPI.extract.fromText(content));
        } catch (err) {
          throw new Error(`Text IPC failed: ${String(err)}`);
        }
      },
      load: async (filePath: string) => {
        try {
          return unwrap(await window.electronAPI.workbook.load(filePath));
        } catch (err) {
          throw new Error(`Workbook load IPC failed: ${String(err)}`);
        }
      },
      commit: async (tableModel: TableModel) => {
        try {
          return unwrap(await window.electronAPI.workbook.commit(tableModel));
        } catch (err) {
          throw new Error(`Workbook commit IPC failed: ${String(err)}`);
        }
      },
      rollback: async () => {
        try {
          return unwrap(await window.electronAPI.workbook.rollback());
        } catch (err) {
          throw new Error(`Workbook rollback IPC failed: ${String(err)}`);
        }
      },
      snapshot: async () => {
        try {
          return unwrap(await window.electronAPI.workbook.snapshot());
        } catch (err) {
          throw new Error(`Workbook snapshot IPC failed: ${String(err)}`);
        }
      },
        on: window.electronAPI.on,
      };
    }

    if (MOCK_IPC_ENABLED) {
      return createMockBridge();
    }

    return createMockBridge();
  }, [isElectron]);
}
