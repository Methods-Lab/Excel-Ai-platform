import { BrowserWindow, nativeImage } from 'electron';
import { randomUUID } from 'node:crypto';
import type {
  IExtractionService,
  IpcResponse,
} from '@excellence/shared-types';
import { IpcChannel } from '@excellence/shared-types';
import type {
  ExtractionInput,
  ExtractionJob,
  InputModality,
} from '@excellence/extraction-core';
import {
  ExtractionPipeline,
  JobQueue,
  type ExtractionResult,
} from '@excellence/extraction-core';

interface ProgressPayload {
  jobId: string;
  progress: number;
  message?: string;
}

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_COMPRESS_ATTEMPTS = 6;
const MIN_JPEG_QUALITY = 50;

const stripDataUrl = (base64: string): string =>
  base64.includes(',') ? base64.split(',')[1] ?? '' : base64;

const getModality = (input: ExtractionInput): InputModality =>
  input.type === 'mixed' ? 'mixed' : input.type;

export class ExtractionService implements IExtractionService {
  private pipeline = new ExtractionPipeline();
  private queue = new JobQueue(this.pipeline, (jobId, progress, message) => {
    this.emit(IpcChannel.EXTRACTION_PROGRESS, {
      jobId,
      progress,
      message,
    });
  });

  private emit(channel: IpcChannel, data: ProgressPayload): void {
    const response: IpcResponse<ProgressPayload> = {
      requestId: data.jobId,
      success: true,
      data,
    };
    BrowserWindow.getAllWindows().forEach((win) => {
      win.webContents.send(channel, response);
    });
  }

  private buildJob(input: ExtractionInput): ExtractionJob {
    const now = Date.now();
    return {
      id: randomUUID(),
      modality: getModality(input),
      phase: 'phase1',
      status: 'processing',
      priority: 5,
      input,
      createdAt: now,
      updatedAt: now,
    };
  }

  private prepareImage(
    base64: string,
    mimeType: string
  ): { base64: string; mimeType: string } {
    const rawBase64 = stripDataUrl(base64);
    const rawBytes = Buffer.from(rawBase64, 'base64');
    if (rawBytes.byteLength <= MAX_IMAGE_BYTES) {
      return { base64: rawBase64, mimeType };
    }

    const image = base64.startsWith('data:')
      ? nativeImage.createFromDataURL(base64)
      : nativeImage.createFromBuffer(rawBytes);
    if (image.isEmpty()) {
      throw new Error('Invalid image data.');
    }

    let current = image;
    let quality = 80;
    for (let attempt = 0; attempt < MAX_COMPRESS_ATTEMPTS; attempt += 1) {
      const size = current.getSize();
      if (size.width <= 0 || size.height <= 0) {
        break;
      }
      const resized = attempt === 0
        ? current
        : current.resize({
          width: Math.max(1, Math.floor(size.width * 0.85)),
          height: Math.max(1, Math.floor(size.height * 0.85)),
        });
      const buffer = resized.toJPEG(quality);
      if (buffer.byteLength <= MAX_IMAGE_BYTES) {
        return { base64: buffer.toString('base64'), mimeType: 'image/jpeg' };
      }
      quality = Math.max(MIN_JPEG_QUALITY, quality - 10);
      current = resized;
    }

    throw new Error('Image exceeds 10MB after compression attempts.');
  }

  async fromImage(base64: string, mimeType: string): Promise<ExtractionResult> {
    try {
      const prepared = this.prepareImage(base64, mimeType);
      const job = this.buildJob({
        type: 'image',
        base64: prepared.base64,
        mimeType: prepared.mimeType as 'image/png' | 'image/jpeg' | 'image/webp',
      });
      return await this.queue.enqueue(job);
    } catch (err) {
      throw new Error(`Image extraction failed: ${String(err)}`);
    }
  }

  async fromUrl(url: string, hint?: string): Promise<ExtractionResult> {
    try {
      const job = this.buildJob({ type: 'url', url, tableHint: hint });
      return await this.queue.enqueue(job);
    } catch (err) {
      throw new Error(`URL extraction failed: ${String(err)}`);
    }
  }

  async fromText(content: string): Promise<ExtractionResult> {
    try {
      const job = this.buildJob({ type: 'text', content });
      return await this.queue.enqueue(job);
    } catch (err) {
      throw new Error(`Text extraction failed: ${String(err)}`);
    }
  }
}
