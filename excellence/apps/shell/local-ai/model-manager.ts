import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';

export interface ModelDownloadProgress {
	modelName: string;
	percent: number;
	downloadedBytes: number;
	totalBytes?: number;
}

export class ModelManager {
	async verifySha256(filePath: string, expectedSha256: string): Promise<boolean> {
		const data = await fs.readFile(filePath);
		const hash = createHash('sha256').update(data).digest('hex');
		return hash.toLowerCase() === expectedSha256.toLowerCase();
	}

	async ensureModel(options: {
		modelName: string;
		downloadUrl: string;
		expectedSha256: string;
		cacheDir: string;
		onProgress?: (progress: ModelDownloadProgress) => void;
	}): Promise<string> {
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

		onProgress?.({ modelName, percent: 0, downloadedBytes: 0 });
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

		onProgress?.({
			modelName,
			percent: 100,
			downloadedBytes: buffer.byteLength,
			totalBytes: buffer.byteLength,
		});

		return targetPath;
	}
}
