import { useCallback } from 'react';
import { IPC_CHANNELS } from '@codex-excel/shared-types';
import { useChatStore } from '../stores/chatStore';
import { useIPCBridge } from './useIPCBridge';
import { useExtraction } from './useExtraction';
import { useExtractionStore } from '../stores/extractionStore';
import { useWorkbookStore } from '../stores/workbookStore';

export function useChat() {
  const { messages, isLoading, error, addMessage, setError, setLoading } = useChatStore();
  const { invoke } = useIPCBridge();
  const extraction = useExtraction();

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      // Simple intent classifier (local fallback)
      const classify = (msg: string) => {
        const lower = msg.toLowerCase();
        if (/create a table|create table|generate table|table of/.test(lower)) return 'TABLE_GENERATE';
        if (/scrape|scraper|scrape .*table|get table from|table from https?:\/\//.test(lower)) return 'TABLE_FROM_URL';
        if (/extract the table from the image|extract.*image|from the image/.test(lower)) return 'TABLE_FROM_IMAGE';
        if (/clean up the last table|cleanup|clean up|fix the table/.test(lower)) return 'TABLE_MODIFY';
        if (/commit|save it|save the table/.test(lower)) return 'TABLE_COMMIT';
        if (/undo|revert/.test(lower)) return 'TABLE_UNDO';
        if (/what sheets|sheets are|what sheets are/.test(lower)) return 'WORKBOOK_QUERY';
        return 'GENERAL_CHAT';
      };

      const category = classify(trimmed);

      addMessage({ role: 'user', content: trimmed });
      setLoading(true);
      setError(null);

      try {
        // Extraction helpers
        const { extractFromText, extractFromURL, extractFromImage, commitTable } = extraction;
        const extractionStore = useExtractionStore.getState();
        const workbookStore = useWorkbookStore.getState();

        if (category === 'TABLE_GENERATE') {
          // Treat as a text-to-table generation
          await extractFromText(trimmed);
          return;
        }

        if (category === 'TABLE_FROM_URL') {
          const urlMatch = trimmed.match(/https?:\/\/[\S]+/);
          if (urlMatch) {
            await extractFromURL(urlMatch[0]);
            return;
          }
        }

        if (category === 'TABLE_FROM_IMAGE') {
          if (extractionStore.previewResult?.source === 'image') {
            addMessage({ role: 'assistant', content: extractionStore.previewResult as any });
            return;
          }
          addMessage({ role: 'assistant', content: 'No recent image found. Please upload an image first.' });
          return;
        }

        if (category === 'TABLE_MODIFY') {
          if (!extractionStore.previewResult) {
            addMessage({ role: 'assistant', content: 'No table to modify. Please extract a table first.' });
            return;
          }
          // Build an instruction to send to the AI cleanup endpoint via extractFromText
          const prompt = `Instruction: ${trimmed}\n\nCurrent table: ${JSON.stringify(
            extractionStore.previewResult.table
          )}`;
          await extractFromText(prompt);
          return;
        }

        if (category === 'TABLE_COMMIT') {
          try {
            await commitTable();
            addMessage({ role: 'assistant', content: 'Table committed to workbook.' });
          } catch (err) {
            const message = err instanceof Error ? err.message : 'Commit failed.';
            addMessage({ role: 'assistant', content: message });
          }
          return;
        }

        if (category === 'TABLE_UNDO') {
          // Attempt desktop rollback first
          try {
            if ((window as any).electronAPI?.workbook?.rollback) {
              await (window as any).electronAPI.workbook.rollback();
              addMessage({ role: 'assistant', content: 'Rolled back last change via desktop.' });
            } else {
              const ok = useWorkbookStore.getState().rollbackLastCommit();
              addMessage({ role: 'assistant', content: ok ? 'Rolled back last commit.' : 'Nothing to undo.' });
            }
          } catch (err) {
            addMessage({ role: 'assistant', content: 'Undo failed.' });
          }
          return;
        }

        if (category === 'WORKBOOK_QUERY') {
          const sheets = useWorkbookStore.getState().sheets.map((s) => s.name).join(', ') || 'No sheets';
          addMessage({ role: 'assistant', content: `Workbook sheets: ${sheets}` });
          return;
        }

        // Default: send to AI chat endpoint
        const response = await invoke(IPC_CHANNELS.CHAT_SEND, { text: trimmed });
        addMessage({ role: 'assistant', content: response.text });
      } catch (caught) {
        const message = caught instanceof Error ? caught.message : 'Chat request failed.';
        setError(message);
        addMessage({ role: 'assistant', content: message });
      } finally {
        setLoading(false);
      }
    },
    [addMessage, invoke, setError, setLoading]
  );

  const sendExtractionResult = useCallback(
    (content: Parameters<typeof addMessage>[0]['content']) => {
      addMessage({ role: 'assistant', content });
    },
    [addMessage]
  );

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    sendExtractionResult,
  };
}
