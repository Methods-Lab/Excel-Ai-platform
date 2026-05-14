import { useRef, useState } from 'react';
import type { ExtractionResult } from '@excellence/shared-types';
import { useChat } from '../../hooks/useChat';
import { useExtraction } from '../../hooks/useExtraction';
import { useToast } from '../shared/Toast';
import { InputBar } from './InputBar';
import { MessageList } from './MessageList';
import { QuickActions } from './QuickActions';

function readFileAsBase64(file: File) {
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

export function ChatView() {
  const { messages, isLoading, sendMessage, sendExtractionResult } = useChat();
  const { extractFromImage, extractFromURL, extractFromText } = useExtraction();
  const { addToast } = useToast();
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);

  const handleExtraction = async (runner: () => Promise<unknown>, successTitle: string) => {
    setIsExtracting(true);
    try {
      const result = await runner();
      if (result && typeof result === 'object' && 'tableModel' in result) {
        sendExtractionResult(result as ExtractionResult);
      }
      addToast({ title: successTitle, description: 'Review the preview before committing.', variant: 'success' });
    } catch (caught) {
      addToast({
        title: 'Action failed',
        description: caught instanceof Error ? caught.message : 'Unknown error',
        variant: 'error',
      });
    } finally {
      setIsExtracting(false);
    }
  };

  const handleImageFile = async (file: File) => {
    const imageBase64 = await readFileAsBase64(file);
    return extractFromImage(imageBase64, file.type || 'image/png');
  };

  const promptUrl = () => {
    const url = window.prompt('Paste the table URL');
    if (!url) return;
    void handleExtraction(() => extractFromURL(url), 'URL extraction ready');
  };

  const promptText = () => {
    const prompt = window.prompt('Describe the table or paste source text');
    if (!prompt) return;
    void handleExtraction(() => extractFromText(prompt), 'Text extraction ready');
  };

  return (
    <section className="flex h-full flex-col">
      <MessageList messages={messages} isLoading={isLoading || isExtracting} />
      <footer className="border-t border-slate-200 bg-white px-4 py-4 dark:border-slate-800 dark:bg-slate-950">
        <div className="mx-auto max-w-4xl space-y-3">
          <QuickActions
            disabled={isExtracting}
            onImage={() => imageInputRef.current?.click()}
            onUrl={promptUrl}
            onText={promptText}
          />
          <InputBar isLoading={isLoading} disabled={isExtracting} onSubmit={sendMessage} />
        </div>
        <input
          ref={imageInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.currentTarget.value = '';
            if (file) {
              void handleExtraction(() => handleImageFile(file), 'Image extraction ready');
            }
          }}
        />
      </footer>
    </section>
  );
}
