import { useCallback } from 'react';
import { useChatStore } from '../stores/chatStore';
import { useIPCBridge } from './useIPCBridge';

export function useChat() {
  const { messages, isLoading, error, addMessage, setError, setLoading } = useChatStore();
  const { send } = useIPCBridge();

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      addMessage({ role: 'user', content: trimmed });
      setLoading(true);
      setError(null);

      try {
        const response = await send(trimmed);
        addMessage({ role: 'assistant', content: response.message });
      } catch (caught) {
        const message = caught instanceof Error ? caught.message : 'Chat request failed.';
        setError(message);
        addMessage({ role: 'assistant', content: message });
      } finally {
        setLoading(false);
      }
    },
    [addMessage, send, setError, setLoading]
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
