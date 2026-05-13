import { BrowserWindow } from 'electron';
import { randomUUID } from 'node:crypto';
import type {
  IExtractionService,
  IpcResponse,
} from '@codex-excel/shared-types';
import { IpcChannel } from '@codex-excel/shared-types';
import type {
  ExtractionInput,
  ExtractionJob,
  InputModality,
} from '@excel-ai-platform/extraction-core';
import {
  ExtractionPipeline,
  JobQueue,
  type ExtractionResult,
} from '@excel-ai-platform/extraction-core';

interface ProgressPayload {
  jobId: string;
  progress: number;
  message?: string;
}

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

  private ensureImageSize(base64: string): void {
    const bytes = Buffer.from(stripDataUrl(base64), 'base64').byteLength;
    const maxBytes = 10 * 1024 * 1024;
    if (bytes > maxBytes) {
      throw new Error('Image exceeds 10MB. Please upload a smaller file.');
    }
  }

  async fromImage(base64: string, mimeType: string): Promise<ExtractionResult> {
    this.ensureImageSize(base64);
    const job = this.buildJob({ type: 'image', base64: stripDataUrl(base64), mimeType });
    return this.queue.enqueue(job);
  }

  async fromUrl(url: string, hint?: string): Promise<ExtractionResult> {
    const job = this.buildJob({ type: 'url', url, tableHint: hint });
    return this.queue.enqueue(job);
  }

  async fromText(content: string): Promise<ExtractionResult> {
    const job = this.buildJob({ type: 'text', content });
    return this.queue.enqueue(job);
  }
}
