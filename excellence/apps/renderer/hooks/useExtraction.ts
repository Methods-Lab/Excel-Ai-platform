import { useCallback } from 'react';
import {
  IPC_CHANNELS,
  type ExtractionResult,
  type ExtractionSource,
} from '@codex-excel/shared-types';
import { useExtractionStore } from '../stores/extractionStore';
import { useWorkbookStore } from '../stores/workbookStore';
import { useIPCBridge } from './useIPCBridge';

const progressDuration: Record<ExtractionSource, number> = {
  image: 900,
  url: 1000,
  text: 700,
  document: 1100,
};

function fileToBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result ?? '');
      resolve(result.includes(',') ? result.split(',')[1] : result);
    };
    reader.onerror = () => reject(reader.error ?? new Error('Unable to read file.'));
    reader.readAsDataURL(file);
  });
}

export function useExtraction() {
  const {
    currentJob,
    previewResult,
    isPreviewOpen,
    startExtraction,
    updateProgress,
    showPreview,
    commitResult,
    failJob,
    dismissPreview,
  } = useExtractionStore();
  const { activeSheet, addTableToSheet } = useWorkbookStore();
  const { invoke } = useIPCBridge();

  const trackProgress = useCallback(
    (jobId: string, durationMs: number) => {
      let step = 0;
      const steps = 8;
      const timer = window.setInterval(() => {
        step += 1;
        updateProgress(jobId, Math.min(92, Math.round((step / steps) * 100)));
        if (step >= steps) {
          window.clearInterval(timer);
        }
      }, durationMs / steps);

      return () => window.clearInterval(timer);
    },
    [updateProgress]
  );

  const runExtraction = useCallback(
    async (
      source: ExtractionSource,
      request: Promise<ExtractionResult>
    ): Promise<ExtractionResult> => {
      const jobId = startExtraction(source);
      const stopProgress = trackProgress(jobId, progressDuration[source]);

      try {
        const response = await request;
        stopProgress();
        updateProgress(jobId, 100, 'Preview ready');
        showPreview(jobId, response);
        return response;
      } catch (caught) {
        stopProgress();
        const message = caught instanceof Error ? caught.message : 'Extraction failed.';
        failJob(jobId, message);
        throw caught;
      }
    },
    [failJob, showPreview, startExtraction, trackProgress, updateProgress]
  );

  const extractFromImage = useCallback(
    (imageBase64: string, sheetName = activeSheet ?? undefined) =>
      runExtraction(
        'image',
        invoke(IPC_CHANNELS.EXTRACT_FROM_IMAGE, { imageBase64, sheetName })
      ),
    [activeSheet, invoke, runExtraction]
  );

  const extractFromURL = useCallback(
    (url: string, sheetName = activeSheet ?? undefined) =>
      runExtraction('url', invoke(IPC_CHANNELS.EXTRACT_FROM_URL, { url, sheetName })),
    [activeSheet, invoke, runExtraction]
  );

  const extractFromText = useCallback(
    (prompt: string, sheetName = activeSheet ?? undefined) =>
      runExtraction('text', invoke(IPC_CHANNELS.EXTRACT_FROM_TEXT, { prompt, sheetName })),
    [activeSheet, invoke, runExtraction]
  );

  const extractFromDocument = useCallback(
    async (file: File, sheetName = activeSheet ?? undefined) => {
      const fileBase64 = await fileToBase64(file);
      return runExtraction(
        'document',
        invoke(IPC_CHANNELS.EXTRACT_FROM_DOCUMENT, {
          fileName: file.name,
          fileBase64,
          mimeType: file.type,
          sheetName,
        })
      );
    },
    [activeSheet, invoke, runExtraction]
  );

  const commitTable = useCallback(
    async (targetSheet = activeSheet ?? previewResult?.table.sheetName ?? 'Sheet1') => {
      if (!previewResult) {
        throw new Error('No preview result to commit.');
      }

      const response = await invoke(IPC_CHANNELS.TABLE_COMMIT, {
        sheetName: targetSheet,
        table: previewResult.table,
        position: { row: 0, col: 0 },
        overwriteExisting: false,
      });

      if (response.success) {
        addTableToSheet(targetSheet, previewResult.table);
        if (currentJob) {
          commitResult(currentJob.id);
        }
      }

      return response;
    },
    [activeSheet, addTableToSheet, commitResult, currentJob, invoke, previewResult]
  );

  return {
    currentJob,
    previewResult,
    isPreviewOpen,
    extractFromImage,
    extractFromURL,
    extractFromText,
    extractFromDocument,
    commitTable,
    dismissPreview,
  };
}
