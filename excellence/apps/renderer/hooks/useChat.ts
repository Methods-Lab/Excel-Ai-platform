import { useCallback } from 'react';
import { IPC_CHANNELS } from '@codex-excel/shared-types';
import { useChatStore } from '../stores/chatStore';
import { useIPCBridge } from './useIPCBridge';

export function useChat() {
  const { messages, isLoading, error, addMessage, setError, setLoading } = useChatStore();
  const { invoke } = useIPCBridge();

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      addMessage({ role: 'user', content: trimmed });
      setLoading(true);
      setError(null);

      try {
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
