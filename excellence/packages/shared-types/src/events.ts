import { IpcChannel } from './ipc';

export const RendererEvents = {
  EXTRACTION_PROGRESS: IpcChannel.EXTRACTION_PROGRESS,
  EXTRACTION_RESULT: IpcChannel.EXTRACTION_RESULT,
  EXTRACTION_ERROR: IpcChannel.EXTRACTION_ERROR,
  CHAT_RESPONSE: IpcChannel.CHAT_RESPONSE,
  AI_RESPONSE: IpcChannel.AI_RESPONSE,
  RELAY_STATUS: IpcChannel.RELAY_STATUS,
  MODEL_DOWNLOAD_PROGRESS: IpcChannel.MODEL_DOWNLOAD_PROGRESS,
} as const;

export type RendererEventName = typeof RendererEvents[keyof typeof RendererEvents];
