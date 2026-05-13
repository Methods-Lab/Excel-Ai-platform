import { contextBridge, ipcRenderer } from 'electron';
import type { IpcChannel, IpcPayload, IpcResponse } from '@codex-excel/shared-types';
import { IpcChannel as Channels } from '@codex-excel/shared-types';

const buildPayload = <T>(data: T): IpcPayload<T> => ({
	requestId: crypto.randomUUID(),
	timestamp: Date.now(),
	data,
});

contextBridge.exposeInMainWorld('electronAPI', {
	chat: {
		send: (prompt: string) =>
			ipcRenderer.invoke(Channels.CHAT_SEND, buildPayload({ prompt })),
	},
	extract: {
		fromImage: (base64: string, mimeType: string) =>
			ipcRenderer.invoke(
				Channels.EXTRACTION_START,
				buildPayload({ type: 'image', base64, mimeType })
			),
		fromUrl: (url: string, hint?: string) =>
			ipcRenderer.invoke(
				Channels.EXTRACTION_START,
				buildPayload({ type: 'url', url, tableHint: hint })
			),
		fromText: (content: string) =>
			ipcRenderer.invoke(
				Channels.EXTRACTION_START,
				buildPayload({ type: 'text', content })
			),
	},
	workbook: {
		load: (filePath: string) =>
			ipcRenderer.invoke(Channels.WORKBOOK_LOAD, buildPayload({ filePath })),
		commit: (tableModel: unknown) =>
			ipcRenderer.invoke(Channels.WORKBOOK_COMMIT, buildPayload({ tableModel })),
		rollback: () =>
			ipcRenderer.invoke(Channels.WORKBOOK_ROLLBACK, buildPayload({})),
		snapshot: () =>
			ipcRenderer.invoke(Channels.WORKBOOK_SNAPSHOT, buildPayload({})),
	},
	on: (channel: IpcChannel, listener: (response: IpcResponse<unknown>) => void) => {
		const handler = (_event: Electron.IpcRendererEvent, res: IpcResponse<unknown>) =>
			listener(res);
		ipcRenderer.on(channel, handler);
		return () => ipcRenderer.removeListener(channel, handler);
	},
});
