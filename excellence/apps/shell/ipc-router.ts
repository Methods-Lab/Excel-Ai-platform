import { dialog, ipcMain } from 'electron';
import { z } from 'zod';
import { API_BASE_URL } from '@codex-excel/shared-types/config';
import { IpcChannel, type IpcResponse } from '@codex-excel/shared-types';
import type {
	ChatResponse,
	CommitResult,
	IChatService,
	IExtractionService,
	IWorkbookService,
	WorkbookInfo,
} from '@codex-excel/shared-types';
import type { ExtractionResult, TableModel } from '@excel-ai-platform/extraction-core';

interface Services {
	chatService: IChatService;
	extractionService: IExtractionService;
	workbookService: IWorkbookService;
}

const errorResponse = <T>(
	requestId: string,
	code: string,
	message: string,
	recoverable: boolean
): IpcResponse<T> => ({
	requestId,
	success: false,
	error: { code, message, recoverable },
});

const logDuration = (channel: IpcChannel, requestId: string, start: number): void => {
	console.log(`[IPC] ${channel} | ${requestId} | ${Date.now() - start}ms`);
};

const tableModelSchema: z.ZodType<TableModel> = z.object({
	id: z.string(),
	name: z.string(),
	sheetName: z.string(),
	headers: z.array(
		z.object({
			name: z.string(),
			inferredType: z.enum([
				'text',
				'number',
				'currency',
				'date',
				'percentage',
				'boolean',
			]),
			format: z.string().optional(),
		})
	),
	rows: z.array(
		z.array(z.union([z.string(), z.number(), z.boolean(), z.null()]))
	),
	flaggedCells: z.array(
		z.object({
			row: z.number().int().min(0),
			col: z.number().int().min(0),
			rawValue: z.string(),
			suggestedValue: z.string(),
			confidence: z.number().min(0).max(1),
			reason: z.string(),
		})
	),
	sourceRef: z.string(),
	extractedAt: z.number(),
});

export const registerIpcHandlers = (services: Services): void => {
	ipcMain.handle(IpcChannel.EXTRACTION_START, async (_event, rawPayload: unknown) => {
		const start = Date.now();
		const Schema = z.object({
			requestId: z.string().uuid(),
			timestamp: z.number(),
			data: z.union([
				z.object({
					type: z.literal('image'),
					base64: z.string().min(1),
					mimeType: z.enum(['image/png', 'image/jpeg', 'image/webp']),
				}),
				z.object({
					type: z.literal('url'),
					url: z.string().url(),
					tableHint: z.string().optional(),
				}),
				z.object({
					type: z.literal('text'),
					content: z.string().min(1),
				}),
			]),
		});

		const parsed = Schema.safeParse(rawPayload);
		if (!parsed.success) {
			return errorResponse<ExtractionResult>(
				(rawPayload as { requestId?: string }).requestId ?? 'unknown',
				'VALIDATION_ERROR',
				parsed.error.message,
				true
			);
		}

		try {
			const { requestId, data } = parsed.data;
			let result: ExtractionResult;
			if (data.type === 'image') {
				result = await services.extractionService.fromImage(data.base64, data.mimeType);
			} else if (data.type === 'url') {
				result = await services.extractionService.fromUrl(data.url, data.tableHint);
			} else {
				result = await services.extractionService.fromText(data.content);
			}
			logDuration(IpcChannel.EXTRACTION_START, requestId, start);
			return { requestId, success: true, data: result };
		} catch (err) {
			const requestId = parsed.data.requestId;
			logDuration(IpcChannel.EXTRACTION_START, requestId, start);
			return errorResponse<ExtractionResult>(
				requestId,
				'EXTRACTION_ERROR',
				String(err),
				true
			);
		}
	});

	ipcMain.handle(IpcChannel.WORKBOOK_LOAD, async (_event, rawPayload: unknown) => {
		const start = Date.now();
		const Schema = z.object({
			requestId: z.string().uuid(),
			timestamp: z.number(),
			data: z.object({ filePath: z.string().min(1) }),
		});
		const parsed = Schema.safeParse(rawPayload);
		if (!parsed.success) {
			return errorResponse<WorkbookInfo>(
				(rawPayload as { requestId?: string }).requestId ?? 'unknown',
				'VALIDATION_ERROR',
				parsed.error.message,
				true
			);
		}
		try {
			const { requestId, data } = parsed.data;
			const info = await services.workbookService.load(data.filePath);
			logDuration(IpcChannel.WORKBOOK_LOAD, requestId, start);
			return { requestId, success: true, data: info };
		} catch (err) {
			const requestId = parsed.data.requestId;
			logDuration(IpcChannel.WORKBOOK_LOAD, requestId, start);
			return errorResponse<WorkbookInfo>(
				requestId,
				'WORKBOOK_LOAD_ERROR',
				String(err),
				true
			);
		}
	});

	ipcMain.handle(IpcChannel.WORKBOOK_COMMIT, async (_event, rawPayload: unknown) => {
		const start = Date.now();
		const Schema = z.object({
			requestId: z.string().uuid(),
			timestamp: z.number(),
			data: z.object({ tableModel: tableModelSchema }),
		});
		const parsed = Schema.safeParse(rawPayload);
		if (!parsed.success) {
			return errorResponse<CommitResult>(
				(rawPayload as { requestId?: string }).requestId ?? 'unknown',
				'VALIDATION_ERROR',
				parsed.error.message,
				true
			);
		}
		try {
			const { requestId, data } = parsed.data;
			const result = await services.workbookService.commit(data.tableModel);
			logDuration(IpcChannel.WORKBOOK_COMMIT, requestId, start);
			return { requestId, success: true, data: result };
		} catch (err) {
			const requestId = parsed.data.requestId;
			logDuration(IpcChannel.WORKBOOK_COMMIT, requestId, start);
			return errorResponse<CommitResult>(
				requestId,
				'WORKBOOK_COMMIT_ERROR',
				String(err),
				true
			);
		}
	});

	ipcMain.handle(IpcChannel.WORKBOOK_ROLLBACK, async (_event, rawPayload: unknown) => {
		const start = Date.now();
		const Schema = z.object({
			requestId: z.string().uuid(),
			timestamp: z.number(),
			data: z.object({}).optional().default({}),
		});
		const parsed = Schema.safeParse(rawPayload);
		if (!parsed.success) {
			return errorResponse<void>(
				(rawPayload as { requestId?: string }).requestId ?? 'unknown',
				'VALIDATION_ERROR',
				parsed.error.message,
				true
			);
		}
		try {
			const { requestId } = parsed.data;
			await services.workbookService.rollback();
			logDuration(IpcChannel.WORKBOOK_ROLLBACK, requestId, start);
			return { requestId, success: true, data: undefined };
		} catch (err) {
			const requestId = parsed.data.requestId;
			logDuration(IpcChannel.WORKBOOK_ROLLBACK, requestId, start);
			return errorResponse<void>(
				requestId,
				'WORKBOOK_ROLLBACK_ERROR',
				String(err),
				true
			);
		}
	});

	ipcMain.handle(IpcChannel.WORKBOOK_SNAPSHOT, async (_event, rawPayload: unknown) => {
		const start = Date.now();
		const Schema = z.object({
			requestId: z.string().uuid(),
			timestamp: z.number(),
			data: z.object({}).optional().default({}),
		});
		const parsed = Schema.safeParse(rawPayload);
		if (!parsed.success) {
			return errorResponse<string>(
				(rawPayload as { requestId?: string }).requestId ?? 'unknown',
				'VALIDATION_ERROR',
				parsed.error.message,
				true
			);
		}
		try {
			const { requestId } = parsed.data;
			const snapshotPath = await services.workbookService.snapshot();
			logDuration(IpcChannel.WORKBOOK_SNAPSHOT, requestId, start);
			return { requestId, success: true, data: snapshotPath };
		} catch (err) {
			const requestId = parsed.data.requestId;
			logDuration(IpcChannel.WORKBOOK_SNAPSHOT, requestId, start);
			return errorResponse<string>(
				requestId,
				'WORKBOOK_SNAPSHOT_ERROR',
				String(err),
				true
			);
		}
	});

	ipcMain.handle(IpcChannel.CHAT_SEND, async (_event, rawPayload: unknown) => {
		const start = Date.now();
		const Schema = z.object({
			requestId: z.string().uuid(),
			timestamp: z.number(),
			data: z.object({ prompt: z.string().min(1) }),
		});
		const parsed = Schema.safeParse(rawPayload);
		if (!parsed.success) {
			return errorResponse<ChatResponse>(
				(rawPayload as { requestId?: string }).requestId ?? 'unknown',
				'VALIDATION_ERROR',
				parsed.error.message,
				true
			);
		}

		try {
			const { requestId, data } = parsed.data;
			const response = await services.chatService.send(data.prompt);
			logDuration(IpcChannel.CHAT_SEND, requestId, start);
			return { requestId, success: true, data: response };
		} catch (err) {
			const requestId = parsed.data.requestId;
			logDuration(IpcChannel.CHAT_SEND, requestId, start);
			return errorResponse<ChatResponse>(
				requestId,
				'CHAT_ERROR',
				String(err),
				true
			);
		}
	});

	ipcMain.handle(IpcChannel.AI_QUERY, async (_event, rawPayload: unknown) => {
		const start = Date.now();
		const Schema = z.object({
			requestId: z.string().uuid(),
			timestamp: z.number(),
			data: z.object({
				prompt: z.string().min(1),
				systemInstruction: z.string().optional(),
			}),
		});
		const parsed = Schema.safeParse(rawPayload);
		if (!parsed.success) {
			return errorResponse<{ result: string }>(
				(rawPayload as { requestId?: string }).requestId ?? 'unknown',
				'VALIDATION_ERROR',
				parsed.error.message,
				true
			);
		}

		try {
			const { requestId, data } = parsed.data;
			const res = await fetch(`${API_BASE_URL}/ai/query`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'X-Request-ID': requestId,
				},
				body: JSON.stringify({
					prompt: data.prompt,
					systemInstruction: data.systemInstruction ?? '',
					requestId,
				}),
			});
			const body = await res.json();
			logDuration(IpcChannel.AI_QUERY, requestId, start);
			return {
				requestId,
				success: res.ok,
				data: res.ok ? body : undefined,
				error: res.ok
					? undefined
					: {
							code: `HTTP_${res.status}`,
							message: JSON.stringify(body),
							recoverable: res.status < 500,
						},
			};
		} catch (err) {
			const requestId = parsed.data.requestId;
			logDuration(IpcChannel.AI_QUERY, requestId, start);
			return errorResponse<{ result: string }>(
				requestId,
				'NETWORK_ERROR',
				String(err),
				true
			);
		}
	});

	ipcMain.handle(IpcChannel.AI_CONSENT_REQUEST, async (_event, rawPayload: unknown) => {
		const start = Date.now();
		const Schema = z.object({
			requestId: z.string().uuid(),
			timestamp: z.number(),
			data: z.object({ action: z.string().min(1), detail: z.string().min(1) }),
		});
		const parsed = Schema.safeParse(rawPayload);
		if (!parsed.success) {
			return errorResponse<{ granted: boolean }>(
				(rawPayload as { requestId?: string }).requestId ?? 'unknown',
				'VALIDATION_ERROR',
				parsed.error.message,
				true
			);
		}

		try {
			const { requestId, data } = parsed.data;
			const result = await dialog.showMessageBox({
				type: 'question',
				buttons: ['Yes', 'No'],
				defaultId: 0,
				cancelId: 1,
				title: 'Consent Required',
				message: data.action,
				detail: data.detail,
				noLink: true,
			});
			const granted = result.response === 0;
			logDuration(IpcChannel.AI_CONSENT_REQUEST, requestId, start);
			return { requestId, success: true, data: { granted } };
		} catch (err) {
			const requestId = parsed.data.requestId;
			logDuration(IpcChannel.AI_CONSENT_REQUEST, requestId, start);
			return errorResponse<{ granted: boolean }>(
				requestId,
				'CONSENT_ERROR',
				String(err),
				true
			);
		}
	});

	ipcMain.handle(IpcChannel.SETTINGS_SAVE, async (_event, rawPayload: unknown) => {
		const start = Date.now();
		const Schema = z.object({
			requestId: z.string().uuid(),
			timestamp: z.number(),
			data: z.record(z.unknown()),
		});
		const parsed = Schema.safeParse(rawPayload);
		if (!parsed.success) {
			return errorResponse<Record<string, unknown>>(
				(rawPayload as { requestId?: string }).requestId ?? 'unknown',
				'VALIDATION_ERROR',
				parsed.error.message,
				true
			);
		}
		const { requestId, data } = parsed.data;
		logDuration(IpcChannel.SETTINGS_SAVE, requestId, start);
		return { requestId, success: true, data };
	});

	ipcMain.handle(IpcChannel.SETTINGS_LOAD, async (_event, rawPayload: unknown) => {
		const start = Date.now();
		const Schema = z.object({
			requestId: z.string().uuid(),
			timestamp: z.number(),
			data: z.object({}).optional().default({}),
		});
		const parsed = Schema.safeParse(rawPayload);
		if (!parsed.success) {
			return errorResponse<Record<string, unknown>>(
				(rawPayload as { requestId?: string }).requestId ?? 'unknown',
				'VALIDATION_ERROR',
				parsed.error.message,
				true
			);
		}
		const { requestId } = parsed.data;
		logDuration(IpcChannel.SETTINGS_LOAD, requestId, start);
		return { requestId, success: true, data: {} };
	});

	ipcMain.handle(IpcChannel.HEALTH_CHECK, async (_event, rawPayload: unknown) => {
		const start = Date.now();
		const Schema = z.object({
			requestId: z.string().uuid(),
			timestamp: z.number(),
			data: z.object({}).optional().default({}),
		});
		const parsed = Schema.safeParse(rawPayload);
		if (!parsed.success) {
			return errorResponse<{ status: string }>(
				(rawPayload as { requestId?: string }).requestId ?? 'unknown',
				'VALIDATION_ERROR',
				parsed.error.message,
				true
			);
		}
		const { requestId } = parsed.data;
		logDuration(IpcChannel.HEALTH_CHECK, requestId, start);
		return { requestId, success: true, data: { status: 'ok' } };
	});

	ipcMain.handle(IpcChannel.FILE_OPEN, async (_event, rawPayload: unknown) => {
		const start = Date.now();
		const Schema = z.object({
			requestId: z.string().uuid(),
			timestamp: z.number(),
			data: z.object({}).optional().default({}),
		});
		const parsed = Schema.safeParse(rawPayload);
		if (!parsed.success) {
			return errorResponse<{ canceled: boolean; filePath?: string }>(
				(rawPayload as { requestId?: string }).requestId ?? 'unknown',
				'VALIDATION_ERROR',
				parsed.error.message,
				true
			);
		}
		try {
			const { requestId } = parsed.data;
			const result = await dialog.showOpenDialog({
				properties: ['openFile'],
				filters: [{ name: 'Excel Files', extensions: ['xlsx', 'xlsm'] }],
			});
			logDuration(IpcChannel.FILE_OPEN, requestId, start);
			return {
				requestId,
				success: true,
				data: {
					canceled: result.canceled,
					filePath: result.filePaths[0],
				},
			};
		} catch (err) {
			const requestId = parsed.data.requestId;
			logDuration(IpcChannel.FILE_OPEN, requestId, start);
			return errorResponse<{ canceled: boolean; filePath?: string }>(
				requestId,
				'FILE_OPEN_ERROR',
				String(err),
				true
			);
		}
	});

	ipcMain.handle(IpcChannel.FILE_CLOSE, async (_event, rawPayload: unknown) => {
		const start = Date.now();
		const Schema = z.object({
			requestId: z.string().uuid(),
			timestamp: z.number(),
			data: z.object({}).optional().default({}),
		});
		const parsed = Schema.safeParse(rawPayload);
		if (!parsed.success) {
			return errorResponse<void>(
				(rawPayload as { requestId?: string }).requestId ?? 'unknown',
				'VALIDATION_ERROR',
				parsed.error.message,
				true
			);
		}
		try {
			const { requestId } = parsed.data;
			if (services.workbookService instanceof Object && 'releaseAll' in services.workbookService) {
				const release = services.workbookService as IWorkbookService & { releaseAll?: () => Promise<void> };
				await release.releaseAll?.();
			}
			logDuration(IpcChannel.FILE_CLOSE, requestId, start);
			return { requestId, success: true, data: undefined };
		} catch (err) {
			const requestId = parsed.data.requestId;
			logDuration(IpcChannel.FILE_CLOSE, requestId, start);
			return errorResponse<void>(
				requestId,
				'FILE_CLOSE_ERROR',
				String(err),
				true
			);
		}
	});

	const eventOnlyChannels: IpcChannel[] = [
		IpcChannel.EXTRACTION_PROGRESS,
		IpcChannel.EXTRACTION_RESULT,
		IpcChannel.EXTRACTION_ERROR,
		IpcChannel.CHAT_RESPONSE,
		IpcChannel.AI_RESPONSE,
		IpcChannel.RELAY_STATUS,
		IpcChannel.MODEL_DOWNLOAD_PROGRESS,
		IpcChannel.AI_CONSENT_RESPONSE,
	];

	for (const channel of eventOnlyChannels) {
		ipcMain.handle(channel, async (_event, rawPayload: unknown) => {
			const requestId = (rawPayload as { requestId?: string }).requestId ?? 'unknown';
			return errorResponse<unknown>(
				requestId,
				'EVENT_ONLY',
				'This channel is event-only.',
				true
			);
		});
	}
};
