import { app, BrowserWindow, Menu, Notification, Tray, nativeImage } from 'electron';
import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import path from 'node:path';
import { API_PORT, OCR_PORT } from '@codex-excel/shared-types/config';
import { LocalModelClient } from './local-ai/LocalModelClient';
import { registerIpcHandlers } from './ipc-router';
import { ChatService } from './services/ChatService';
import { ExtractionService } from './services/ExtractionService';
import { WorkbookService } from './services/WorkbookService';

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let apiProcess: ChildProcessWithoutNullStreams | null = null;
let ocrProcess: ChildProcessWithoutNullStreams | null = null;
let workbookService: WorkbookService | null = null;

const startService = (
	name: string,
	command: string,
	args: string[],
	cwd: string
): ChildProcessWithoutNullStreams => {
	const child = spawn(command, args, {
		cwd,
		env: process.env,
		shell: true,
	});

	child.stdout.on('data', (data) => {
		process.stdout.write(`[${name}] ${data}`);
	});
	child.stderr.on('data', (data) => {
		process.stderr.write(`[${name}] ${data}`);
	});

	return child;
};

const pollHealth = async (port: number, maxWaitMs = 20000): Promise<void> => {
	const start = Date.now();
	const url = `http://localhost:${port}/health`;

	while (Date.now() - start < maxWaitMs) {
		try {
			const res = await fetch(url);
			if (res.ok) {
				return;
			}
		} catch {
			// retry
		}
		await new Promise((resolve) => setTimeout(resolve, 500));
	}

	throw new Error(`Health check timed out for port ${port}.`);
};

const createWindow = (): BrowserWindow => {
	const win = new BrowserWindow({
		width: 1280,
		height: 840,
		show: false,
		webPreferences: {
			contextIsolation: true,
			nodeIntegration: false,
			preload: path.join(__dirname, 'preload.js'),
		},
	});

	const rendererPath = path.resolve(app.getAppPath(), '..', 'renderer', 'index.html');
	const devUrl = process.env.VITE_DEV_SERVER_URL;
	if (devUrl) {
		win.loadURL(devUrl).catch(console.error);
	} else {
		win.loadFile(rendererPath).catch(console.error);
	}

	win.once('ready-to-show', () => {
		win.show();
	});

	return win;
};

const buildTray = (window: BrowserWindow): void => {
	const iconPath = path.join(app.getAppPath(), 'assets', 'tray.png');
	const image = nativeImage.createFromPath(iconPath).isEmpty()
		? nativeImage.createEmpty()
		: nativeImage.createFromPath(iconPath);
	tray = new Tray(image);
	const menu = Menu.buildFromTemplate([
		{
			label: 'Show/Hide',
			click: () => {
				if (window.isVisible()) {
					window.hide();
				} else {
					window.show();
				}
			},
		},
		{
			label: 'Quit',
			click: () => app.quit(),
		},
	]);
	tray.setContextMenu(menu);
	tray.setToolTip('Excellence');
};

const shutdownProcess = async (proc: ChildProcessWithoutNullStreams | null): Promise<void> => {
	if (!proc) return;
	proc.kill('SIGTERM');
	await new Promise<void>((resolve) => {
		const timeout = setTimeout(() => {
			proc.kill('SIGKILL');
			resolve();
		}, 3000);
		proc.once('exit', () => {
			clearTimeout(timeout);
			resolve();
		});
	});
};

app.whenReady().then(async () => {
	const workspaceRoot = path.resolve(app.getAppPath(), '..', '..');
	const servicesApiPath = path.join(workspaceRoot, 'services', 'api');
	const servicesOcrPath = path.join(workspaceRoot, 'services', 'ocr-service');

	apiProcess = startService('API', 'uvicorn', ['main:app', '--port', String(API_PORT)], servicesApiPath);
	ocrProcess = startService('OCR', 'uvicorn', ['main:app', '--port', String(OCR_PORT)], servicesOcrPath);

	const ocrNoticeTimer = setTimeout(() => {
		new Notification({
			title: 'OCR service starting',
			body: 'The OCR service is still warming up.',
		}).show();
	}, 10000);

	await Promise.all([pollHealth(API_PORT), pollHealth(OCR_PORT)]).finally(() => {
		clearTimeout(ocrNoticeTimer);
	});

	mainWindow = createWindow();
	buildTray(mainWindow);

	workbookService = new WorkbookService();
	const chatService = new ChatService();
	const extractionService = new ExtractionService();

	registerIpcHandlers({
		chatService,
		extractionService,
		workbookService,
	});

	const localModelClient = new LocalModelClient();
	setImmediate(() => {
		localModelClient.generate('hello').catch(() => undefined);
	});
});

app.on('before-quit', async () => {
	await workbookService?.releaseAll();
	await shutdownProcess(apiProcess);
	await shutdownProcess(ocrProcess);
});

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit();
	}
});
