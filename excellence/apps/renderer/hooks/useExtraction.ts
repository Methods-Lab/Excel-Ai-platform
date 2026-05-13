import { useCallback } from 'react';
import type {
  ExtractionInput,
  ExtractionResult,
  InputModality,
} from '@codex-excel/shared-types';
import { useExtractionStore } from '../stores/extractionStore';
import { useWorkbookStore } from '../stores/workbookStore';
import { useIPCBridge } from './useIPCBridge';

const progressDuration: Record<InputModality, number> = {
  image: 900,
  url: 1000,
  text: 700,
  mixed: 1100,
};

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
  const { fromImage, fromUrl, fromText, commit } = useIPCBridge();

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
      input: ExtractionInput,
      request: Promise<ExtractionResult>
    ): Promise<ExtractionResult> => {
      const jobId = startExtraction(input);
      const modality: InputModality = input.type === 'mixed' ? 'mixed' : input.type;
      const stopProgress = trackProgress(jobId, progressDuration[modality]);

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
    (imageBase64: string, mimeType = 'image/png') =>
      runExtraction(
        { type: 'image', base64: imageBase64, mimeType },
        fromImage(imageBase64, mimeType)
      ),
    [fromImage, runExtraction]
  );

  const extractFromURL = useCallback(
    (url: string, hint?: string) =>
      runExtraction({ type: 'url', url, tableHint: hint }, fromUrl(url, hint)),
    [fromUrl, runExtraction]
  );

  const extractFromText = useCallback(
    (prompt: string) =>
      runExtraction({ type: 'text', content: prompt }, fromText(prompt)),
    [fromText, runExtraction]
  );

  const commitTable = useCallback(
    async (targetSheet = activeSheet ?? previewResult?.tableModel.sheetName ?? 'Sheet1') => {
      if (!previewResult) {
        throw new Error('No preview result to commit.');
      }

      const response = await commit({
        ...previewResult.tableModel,
        sheetName: targetSheet,
      });

      addTableToSheet(targetSheet, previewResult.tableModel);
      if (currentJob) {
        commitResult(currentJob.id);
      }

      return response;
    },
    [activeSheet, addTableToSheet, commit, commitResult, currentJob, previewResult]
  );

  return {
    currentJob,
    previewResult,
    isPreviewOpen,
    extractFromImage,
    extractFromURL,
    extractFromText,
    commitTable,
    dismissPreview,
  };
}
