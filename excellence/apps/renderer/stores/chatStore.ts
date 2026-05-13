import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ChatMessage } from '@codex-excel/shared-types';

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  updatedAt: number;
}

interface ChatState {
  messages: ChatMessage[];
  sessions: ChatSession[];
  activeSessionId: string | null;
  isLoading: boolean;
  error: string | null;
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => void;
  startNewChat: () => void;
  restoreChat: (sessionId: string) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  clearMessages: () => void;
}

const createWelcomeMessage = (): ChatMessage => ({
  id: crypto.randomUUID(),
  role: 'assistant',
  content:
    'Load a workbook or add a document, image, URL, or text source. I will preview the extracted table before anything is committed.',
  timestamp: Date.now(),
});

const createSessionTitle = (messages: ChatMessage[]) => {
  const firstUserMessage = messages.find((message) => message.role === 'user');
  if (firstUserMessage && typeof firstUserMessage.content === 'string') {
    return firstUserMessage.content.slice(0, 42) || 'Untitled chat';
  }

  const date = new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(Date.now());
  return `Chat ${date}`;
};

const shouldArchive = (messages: ChatMessage[]) =>
  messages.some((message) => message.role === 'user');

const archiveCurrentChat = (
  sessions: ChatSession[],
  messages: ChatMessage[],
  activeSessionId: string | null
) => {
  if (!shouldArchive(messages)) return sessions;

  const session: ChatSession = {
    id: activeSessionId ?? crypto.randomUUID(),
    title: createSessionTitle(messages),
    messages,
    updatedAt: Date.now(),
  };

  return [session, ...sessions.filter((item) => item.id !== session.id)].slice(0, 12);
};

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      messages: [
    {
      id: 'welcome',
      role: 'assistant',
      content:
        'Load a workbook or add a document, image, URL, or text source. I will preview the extracted table before anything is committed.',
      timestamp: Date.now(),
    },
  ],
  sessions: [],
  activeSessionId: null,
  isLoading: false,
  error: null,
  addMessage: (message) =>
    set((state) => ({
      messages: [
        ...state.messages,
        {
          ...message,
          id: crypto.randomUUID(),
          timestamp: Date.now(),
        },
      ],
    })),
  startNewChat: () =>
    set((state) => ({
      sessions: archiveCurrentChat(state.sessions, state.messages, state.activeSessionId),
      activeSessionId: null,
      messages: [createWelcomeMessage()],
      error: null,
      isLoading: false,
    })),
  restoreChat: (sessionId) =>
    set((state) => {
      const session = state.sessions.find((item) => item.id === sessionId);
      if (!session) return state;

      return {
        sessions: archiveCurrentChat(state.sessions, state.messages, state.activeSessionId),
        activeSessionId: session.id,
        messages: session.messages,
        error: null,
        isLoading: false,
      };
    }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
      clearMessages: () => set({ messages: [createWelcomeMessage()], error: null }),
    }),
    {
      name: 'excel-ai-chat-history',
      version: 1,
      partialize: (state) => ({
        sessions: archiveCurrentChat(state.sessions, state.messages, state.activeSessionId),
        activeSessionId: state.activeSessionId,
      }),
    }
  )
);
