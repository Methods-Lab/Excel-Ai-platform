import { useEffect, useRef } from 'react';
import type { ChatMessage } from '@codex-excel/shared-types';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { MessageCard } from './MessageCard';

interface MessageListProps {
  messages: ChatMessage[];
  isLoading: boolean;
}

export function MessageList({ messages, isLoading }: MessageListProps) {
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  return (
    <div className="flex-1 overflow-y-auto px-4 py-6">
      <div className="mx-auto flex max-w-4xl flex-col gap-4">
        {messages.map((message) => (
          <MessageCard key={message.id} message={message} />
        ))}
        {isLoading && (
          <div className="pl-11">
            <LoadingSpinner label="Assistant is thinking..." />
          </div>
        )}
        <div ref={endRef} />
      </div>
    </div>
  );
}
