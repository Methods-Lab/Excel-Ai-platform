import { BrowserWindow } from 'electron';
import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { IpcChannel, type IpcResponse } from '@excellence/shared-types';

export interface ModelDownloadProgress {
	modelName: string;
	percent: number;
	downloadedBytes: number;
	totalBytes?: number;
}

const emitProgress = (
	progress: ModelDownloadProgress,
	onProgress?: (progress: ModelDownloadProgress) => void
): void => {
	onProgress?.(progress);
	try {
		const response: IpcResponse<ModelDownloadProgress> = {
			requestId: progress.modelName,
			success: true,
			data: progress,
		};
		BrowserWindow.getAllWindows().forEach((win) => {
			win.webContents.send(IpcChannel.MODEL_DOWNLOAD_PROGRESS, response);
		});
	} catch {
		// Best-effort IPC emit only; ignore failures outside Electron runtime.
	}
};

export class ModelManager {
	async verifySha256(filePath: string, expectedSha256: string): Promise<boolean> {
		try {
			const data = await fs.readFile(filePath);
			const hash = createHash('sha256').update(data).digest('hex');
			return hash.toLowerCase() === expectedSha256.toLowerCase();
		} catch (err) {
			throw new Error(`SHA-256 verification failed: ${String(err)}`);
		}
	}

	async ensureModel(options: {
		modelName: string;
		downloadUrl: string;
		expectedSha256: string;
		cacheDir: string;
		onProgress?: (progress: ModelDownloadProgress) => void;
	}): Promise<string> {
		try {
			const { modelName, downloadUrl, expectedSha256, cacheDir, onProgress } = options;
			await fs.mkdir(cacheDir, { recursive: true });
			const targetPath = path.join(cacheDir, modelName);

			try {
				const exists = await fs
					.stat(targetPath)
					.then(() => true)
					.catch(() => false);
				if (exists && (await this.verifySha256(targetPath, expectedSha256))) {
					return targetPath;
				}
			} catch {
				await fs.rm(targetPath, { force: true });
			}

			emitProgress({ modelName, percent: 0, downloadedBytes: 0 }, onProgress);
			const response = await fetch(downloadUrl);
			if (!response.ok) {
				throw new Error(`Model download failed: ${response.status}`);
			}

			const buffer = new Uint8Array(await response.arrayBuffer());
			await fs.writeFile(targetPath, buffer);

			if (!(await this.verifySha256(targetPath, expectedSha256))) {
				await fs.rm(targetPath, { force: true });
				throw new Error('Model SHA-256 verification failed.');
			}

			emitProgress(
				{
					modelName,
					percent: 100,
					downloadedBytes: buffer.byteLength,
					totalBytes: buffer.byteLength,
				},
				onProgress
			);

			return targetPath;
		} catch (err) {
			throw new Error(`Model download failed: ${String(err)}`);
		}
	}
}
