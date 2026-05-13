import { BrowserWindow } from 'electron';
import { randomUUID } from 'node:crypto';
import { WebSocketServer } from 'ws';
import { IpcChannel, type IpcResponse } from '@codex-excel/shared-types';
import type { RelayCommand, RelayMessage, RelayStatus } from './relay-types';

const isLocalhost = (address?: string | null): boolean => {
	if (!address) return false;
	return (
		address === '127.0.0.1' ||
		address === '::1' ||
		address.startsWith('::ffff:127.0.0.1')
	);
};

export class RelayServer {
	private wss?: WebSocketServer;
	private port = 0;
	private token = randomUUID();
	private status: RelayStatus = 'idle';

	getPort(): number {
		return this.port;
	}

	getToken(): string {
		return this.token;
	}

	start(onHtml?: (html: string) => void): void {
		if (this.wss) return;
		this.wss = new WebSocketServer({ port: 0 });
		this.wss.on('listening', () => {
			const address = this.wss?.address();
			if (typeof address === 'object' && address) {
				this.port = address.port;
			}
			this.updateStatus('connected');
		});

		this.wss.on('connection', (socket, request) => {
			if (!isLocalhost(request.socket.remoteAddress)) {
				socket.close(1008, 'Localhost only');
				return;
			}

			const url = new URL(request.url ?? '/', 'http://localhost');
			const token = url.searchParams.get('token');
			if (token !== this.token) {
				socket.close(1008, 'Invalid token');
				return;
			}

			socket.on('message', (data) => {
				try {
					const message = JSON.parse(String(data)) as RelayMessage;
					if (message.type === 'html' && message.html) {
						this.updateStatus('processing');
						onHtml?.(message.html);
						this.updateStatus('connected');
					}
				} catch {
					this.updateStatus('error');
				}
			});

			socket.on('close', () => this.updateStatus('closed'));
		});
	}

	stop(): void {
		this.wss?.close();
		this.wss = undefined;
		this.updateStatus('closed');
	}

	sendCommand(command: RelayCommand, url?: string): void {
		if (!this.wss) return;
		const payload: RelayMessage = { type: 'command', command, url };
		for (const client of this.wss.clients) {
			if (client.readyState === client.OPEN) {
				client.send(JSON.stringify(payload));
			}
		}
	}

	private updateStatus(status: RelayStatus): void {
		this.status = status;
		const response: IpcResponse<{ status: RelayStatus }> = {
			requestId: this.token,
			success: true,
			data: { status },
		};
		BrowserWindow.getAllWindows().forEach((win) => {
			win.webContents.send(IpcChannel.RELAY_STATUS, response);
		});
	}
}
