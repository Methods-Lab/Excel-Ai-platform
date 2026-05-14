import { create } from 'zustand';
import type {
  ExtractionInput,
  ExtractionJob,
  ExtractionResult,
  InputModality,
} from '@excellence/shared-types';

interface ExtractionJobView extends ExtractionJob {
  progress: number;
  message?: string;
}

interface ExtractionState {
  currentJob: ExtractionJobView | null;
  jobs: ExtractionJobView[];
  previewResult: ExtractionResult | null;
  isPreviewOpen: boolean;
  startExtraction: (input: ExtractionInput) => string;
  updateProgress: (jobId: string, progress: number, message?: string) => void;
  showPreview: (jobId: string, result: ExtractionResult) => void;
  updatePreviewResult: (result: ExtractionResult) => void;
  commitResult: (jobId: string) => void;
  failJob: (jobId: string, error: string) => void;
  dismissPreview: () => void;
}

const updateJob = (
  jobs: ExtractionJobView[],
  jobId: string,
  patch: Partial<ExtractionJobView>
) => jobs.map((job) => (job.id === jobId ? { ...job, ...patch } : job));

export const useExtractionStore = create<ExtractionState>((set) => ({
  currentJob: null,
  jobs: [],
  previewResult: null,
  isPreviewOpen: false,
  startExtraction: (input) => {
    const id = crypto.randomUUID();
    const now = Date.now();
    const modality: InputModality = input.type === 'mixed' ? 'mixed' : input.type;
    const job: ExtractionJobView = {
      id,
      modality,
      phase: 'phase1',
      status: 'processing',
      priority: 5,
      input,
      createdAt: now,
      updatedAt: now,
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
          ? { ...state.currentJob, progress, message, updatedAt: Date.now() }
          : state.currentJob,
      jobs: updateJob(state.jobs, jobId, {
        progress,
        message,
        updatedAt: Date.now(),
      }),
    })),
  showPreview: (jobId, result) =>
    set((state) => ({
      currentJob:
        state.currentJob?.id === jobId
          ? {
              ...state.currentJob,
              status: 'awaiting_preview',
              progress: 100,
              result,
              updatedAt: Date.now(),
            }
          : state.currentJob,
      jobs: updateJob(state.jobs, jobId, {
        status: 'awaiting_preview',
        progress: 100,
        result,
        message: 'Preview ready',
        updatedAt: Date.now(),
      }),
      previewResult: result,
      isPreviewOpen: true,
    })),
  updatePreviewResult: (result) => set({ previewResult: result }),
  commitResult: (jobId) =>
    set((state) => ({
      currentJob:
        state.currentJob?.id === jobId
          ? {
              ...state.currentJob,
              status: 'committed',
              progress: 100,
              updatedAt: Date.now(),
            }
          : state.currentJob,
      jobs: updateJob(state.jobs, jobId, {
        status: 'committed',
        progress: 100,
        message: 'Committed to workbook',
        updatedAt: Date.now(),
      }),
    })),
  failJob: (jobId, error) =>
    set((state) => ({
      currentJob:
        state.currentJob?.id === jobId
          ? {
              ...state.currentJob,
              status: 'failed',
              error: { code: 'EXTRACTION_FAILED', message: error, recoverable: true },
              updatedAt: Date.now(),
            }
          : state.currentJob,
      jobs: updateJob(state.jobs, jobId, {
        status: 'failed',
        error: { code: 'EXTRACTION_FAILED', message: error, recoverable: true },
        message: error,
        updatedAt: Date.now(),
      }),
    })),
  dismissPreview: () => set({ isPreviewOpen: false, previewResult: null }),
}));
