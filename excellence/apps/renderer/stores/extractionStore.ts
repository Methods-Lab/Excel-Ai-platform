import { create } from 'zustand';
import type { ExtractionJob, ExtractionResult, ExtractionSource } from '@codex-excel/shared-types';

interface ExtractionState {
  currentJob: ExtractionJob | null;
  jobs: ExtractionJob[];
  previewResult: ExtractionResult | null;
  isPreviewOpen: boolean;
  startExtraction: (source: ExtractionSource) => string;
  updateProgress: (jobId: string, progress: number, message?: string) => void;
  showPreview: (jobId: string, result: ExtractionResult) => void;
  updatePreviewResult: (result: ExtractionResult) => void;
  commitResult: (jobId: string) => void;
  failJob: (jobId: string, error: string) => void;
  dismissPreview: () => void;
}

const updateJob = (
  jobs: ExtractionJob[],
  jobId: string,
  patch: Partial<ExtractionJob>
) => jobs.map((job) => (job.id === jobId ? { ...job, ...patch } : job));

export const useExtractionStore = create<ExtractionState>((set) => ({
  currentJob: null,
  jobs: [],
  previewResult: null,
  isPreviewOpen: false,
  startExtraction: (source) => {
    const id = crypto.randomUUID();
    const job: ExtractionJob = {
      id,
      source,
      status: 'processing',
      progress: 0,
      message: 'Starting extraction...',
    };

    set((state) => ({
      currentJob: job,
      jobs: [job, ...state.jobs],
    }));

    return id;
  },
  updateProgress: (jobId, progress, message) =>
    set((state) => ({
      currentJob:
        state.currentJob?.id === jobId
          ? { ...state.currentJob, progress, message }
          : state.currentJob,
      jobs: updateJob(state.jobs, jobId, { progress, message }),
    })),
  showPreview: (jobId, result) =>
    set((state) => ({
      currentJob:
        state.currentJob?.id === jobId
          ? { ...state.currentJob, status: 'preview', progress: 100, result }
          : state.currentJob,
      jobs: updateJob(state.jobs, jobId, {
        status: 'preview',
        progress: 100,
        result,
        message: 'Preview ready',
      }),
      previewResult: result,
      isPreviewOpen: true,
    })),
  updatePreviewResult: (result) => set({ previewResult: result }),
  commitResult: (jobId) =>
    set((state) => ({
      currentJob:
        state.currentJob?.id === jobId
          ? { ...state.currentJob, status: 'committed', progress: 100 }
          : state.currentJob,
      jobs: updateJob(state.jobs, jobId, {
        status: 'committed',
        progress: 100,
        message: 'Committed to workbook',
      }),
    })),
  failJob: (jobId, error) =>
    set((state) => ({
      currentJob:
        state.currentJob?.id === jobId
          ? { ...state.currentJob, status: 'failed', error }
          : state.currentJob,
      jobs: updateJob(state.jobs, jobId, { status: 'failed', error, message: error }),
    })),
  dismissPreview: () => set({ isPreviewOpen: false, previewResult: null }),
}));
