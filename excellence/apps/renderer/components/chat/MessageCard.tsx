import { Bot, User } from 'lucide-react';
import type { ChatMessage, ExtractionResult } from '@excellence/shared-types';
import { TablePreviewCard } from './TablePreviewCard';

interface MessageCardProps {
  message: ChatMessage;
}

function isExtractionResult(content: ChatMessage['content']): content is ExtractionResult {
  return typeof content === 'object' && content !== null && 'table' in content;
}

export function MessageCard({ message }: MessageCardProps) {
  const isUser = message.role === 'user';
  const time = new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  }).format(message.timestamp);

  return (
    <article className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
      <div
        className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md ${
          isUser
            ? 'bg-blue-600 text-white'
            : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-200'
        }`}
      >
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>
      <div className={`flex max-w-[78%] flex-col ${isUser ? 'items-end' : 'items-start'}`}>
        <span className="mb-1 text-xs text-slate-400">{isUser ? 'You' : 'Assistant'} · {time}</span>
        {isExtractionResult(message.content) ? (
          <TablePreviewCard result={message.content} />
        ) : (
          <div
            className={`rounded-lg px-4 py-2.5 text-sm leading-6 ${
              isUser
                ? 'bg-blue-600 text-white'
                : 'bg-white text-slate-800 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:text-slate-100 dark:ring-slate-800'
            }`}
          >
            {message.content}
          </div>
        )}
      </div>
    </article>
  );
}
