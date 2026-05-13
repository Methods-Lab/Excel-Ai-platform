export type RelayCommand = 'open-url' | 'capture-html' | 'close';

export type RelayStatus =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'processing'
  | 'closed'
  | 'error';

export interface RelayMessage {
  type: 'command' | 'status' | 'html' | 'error';
  command?: RelayCommand;
  status?: RelayStatus;
  url?: string;
  html?: string;
  error?: string;
}
