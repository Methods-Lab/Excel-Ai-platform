export enum IpcChannel {
  EXTRACTION_START = 'extraction:start',
  EXTRACTION_PROGRESS = 'extraction:progress',
  EXTRACTION_RESULT = 'extraction:result',
  EXTRACTION_ERROR = 'extraction:error',
  FILE_OPEN = 'file:open',
  FILE_CLOSE = 'file:close',
  WORKBOOK_LOAD = 'workbook:load',
  WORKBOOK_COMMIT = 'workbook:commit',
  WORKBOOK_ROLLBACK = 'workbook:rollback',
  WORKBOOK_SNAPSHOT = 'workbook:snapshot',
  CHAT_SEND = 'chat:send',
  CHAT_RESPONSE = 'chat:response',
  AI_QUERY = 'ai:query',
  AI_RESPONSE = 'ai:response',
  AI_CONSENT_REQUEST = 'ai:consent:request',
  AI_CONSENT_RESPONSE = 'ai:consent:response',
  SETTINGS_SAVE = 'settings:save',
  SETTINGS_LOAD = 'settings:load',
  RELAY_STATUS = 'relay:status',
  HEALTH_CHECK = 'health:check',
  MODEL_DOWNLOAD_PROGRESS = 'model:download:progress',
}

export interface IpcPayload<T> {
  requestId: string;
  timestamp: number;
  data: T;
}

export interface IpcResponse<T> {
  requestId: string;
  success: boolean;
  data?: T;
  error?: IpcError;
}

export interface IpcError {
  code: string;
  message: string;
  recoverable: boolean;
}
