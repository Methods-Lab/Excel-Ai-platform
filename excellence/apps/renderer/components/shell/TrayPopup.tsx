import { useRef, useState, type PointerEvent } from 'react';
import {
  Bot,
  FileImage,
  FileSpreadsheet,
  FileText,
  History,
  Link2,
  MessageSquarePlus,
  Pin,
  PinOff,
  Type,
  X,
  type LucideIcon,
} from 'lucide-react';
import { useExtraction } from '../../hooks/useExtraction';
import { useWorkbook } from '../../hooks/useWorkbook';
import { useChatStore } from '../../stores/chatStore';
import { useToast } from '../shared/Toast';

function readAsBase64(file: File) {
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

const POSITION_KEY = 'excel-ai-tray-position';
const LAUNCHER_SIZE = 56;
const PANEL_WIDTH = 288;
const PANEL_HEIGHT = 430;

function getDefaultPosition() {
  return clampPosition(
    {
      x: window.innerWidth - PANEL_WIDTH - 24,
      y: window.innerHeight - PANEL_HEIGHT - 24,
    },
    PANEL_WIDTH,
    PANEL_HEIGHT
  );
}

function getInitialPosition() {
  const defaultPosition = getDefaultPosition();
  try {
    const saved = window.localStorage.getItem(POSITION_KEY);
    if (!saved) return defaultPosition;
    const parsed = JSON.parse(saved) as { x?: number; y?: number };
    return clampPosition(
      {
        x: typeof parsed.x === 'number' ? parsed.x : defaultPosition.x,
        y: typeof parsed.y === 'number' ? parsed.y : defaultPosition.y,
      },
      PANEL_WIDTH,
      PANEL_HEIGHT
    );
  } catch {
    return defaultPosition;
  }
}

function clampPosition(position: { x: number; y: number }, width: number, height: number) {
  const padding = 8;
  const maxX = Math.max(padding, window.innerWidth - width - padding);
  const maxY = Math.max(padding, window.innerHeight - height - padding);
  return {
    x: Math.min(Math.max(position.x, padding), maxX),
    y: Math.min(Math.max(position.y, padding), maxY),
  };
}

export function TrayPopup() {
  const [isOpen, setIsOpen] = useState(
    () => window.localStorage.getItem('excel-ai-tray-pinned') !== 'false'
  );
  const [isPinned, setIsPinnedState] = useState(
    () => window.localStorage.getItem('excel-ai-tray-pinned') !== 'false'
  );
  const [position, setPosition] = useState(getInitialPosition);
  const positionRef = useRef(position);
  const [showHistory, setShowHistory] = useState(false);
  const dragState = useRef<{
    pointerId: number;
    offsetX: number;
    offsetY: number;
    didMove: boolean;
  } | null>(null);
  const suppressClickRef = useRef(false);
  const documentInputRef = useRef<HTMLInputElement | null>(null);
  const imageInputRef = useRef<HTMLInputElement | null>(null);
  const { loadWorkbook } = useWorkbook();
  const { extractFromDocument, extractFromImage, extractFromURL, extractFromText } = useExtraction();
  const { addToast } = useToast();
  const { sessions, startNewChat, restoreChat } = useChatStore();

  const setPinned = (next: boolean) => {
    setIsPinnedState(next);
    window.localStorage.setItem('excel-ai-tray-pinned', String(next));
  };

  const startDrag = (event: PointerEvent<HTMLElement>) => {
    const target = event.currentTarget;
    target.setPointerCapture(event.pointerId);
    dragState.current = {
      pointerId: event.pointerId,
      offsetX: event.clientX - position.x,
      offsetY: event.clientY - position.y,
      didMove: false,
    };
  };

  const moveDrag = (event: PointerEvent<HTMLElement>) => {
    const drag = dragState.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    const nextPosition = clampPosition(
      {
        x: event.clientX - drag.offsetX,
        y: event.clientY - drag.offsetY,
      },
      isOpen ? PANEL_WIDTH : LAUNCHER_SIZE,
      isOpen ? PANEL_HEIGHT : LAUNCHER_SIZE
    );

    if (Math.abs(nextPosition.x - position.x) > 2 || Math.abs(nextPosition.y - position.y) > 2) {
      drag.didMove = true;
    }

    positionRef.current = nextPosition;
    setPosition(nextPosition);
  };

  const endDrag = (event: PointerEvent<HTMLElement>) => {
    const drag = dragState.current;
    if (!drag || drag.pointerId !== event.pointerId) return;

    event.currentTarget.releasePointerCapture(event.pointerId);
    window.localStorage.setItem(POSITION_KEY, JSON.stringify(positionRef.current));
    suppressClickRef.current = drag.didMove;
    dragState.current = null;
    window.setTimeout(() => {
      suppressClickRef.current = false;
    }, 0);
  };

  const run = async (action: () => Promise<unknown>, title: string) => {
    try {
      await action();
      addToast({ title, variant: 'success' });
    } catch (caught) {
      addToast({
        title: 'Taskbar action failed',
        description: caught instanceof Error ? caught.message : 'Unknown error',
        variant: 'error',
      });
    }
  };

  const openNewChat = () => {
    startNewChat();
    setIsOpen(true);
    setShowHistory(false);
    addToast({ title: 'New chat started', variant: 'success' });
  };

  const openPreviousChat = (sessionId: string) => {
    restoreChat(sessionId);
    setIsOpen(true);
    setShowHistory(false);
    addToast({ title: 'Chat restored', variant: 'success' });
  };

  if (!isOpen) {
    return (
      <button
        type="button"
        onPointerDown={startDrag}
        onPointerMove={moveDrag}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onClick={() => {
          if (suppressClickRef.current) return;
          setIsOpen(true);
        }}
        aria-label="Open assistant taskbar"
        title="Drag to move. Click to open."
        style={{ left: position.x, top: position.y }}
        className="fixed z-40 flex h-14 w-14 touch-none items-center justify-center rounded-full bg-blue-600 text-white shadow-lg transition-colors hover:bg-blue-700"
      >
        <Bot className="h-6 w-6" />
      </button>
    );
  }

  return (
    <div
      style={{ left: position.x, top: position.y }}
      className="fixed z-40 w-72 rounded-lg border border-slate-200 bg-white p-3 shadow-xl dark:border-slate-800 dark:bg-slate-900"
    >
      <div
        onPointerDown={startDrag}
        onPointerMove={moveDrag}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        className="mb-3 flex touch-none cursor-move items-center justify-between"
        title="Drag to move"
      >
        <div className="flex min-w-0 items-center gap-2">
          <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-white">
            <Bot className="h-4 w-4" />
          </span>
          <span className="truncate text-sm font-semibold text-slate-900 dark:text-white">
            Assistant taskbar
          </span>
        </div>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setPinned(!isPinned)}
            aria-label={isPinned ? 'Unpin taskbar' : 'Pin taskbar'}
            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            {isPinned ? <Pin className="h-4 w-4" /> : <PinOff className="h-4 w-4" />}
          </button>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            aria-label="Close taskbar"
            className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div className="mb-2 grid grid-cols-2 gap-2">
        <TrayAction icon={MessageSquarePlus} label="New chat" onClick={openNewChat} />
        <TrayAction icon={History} label="History" onClick={() => setShowHistory((value) => !value)} />
      </div>
      {showHistory && (
        <div className="mb-3 max-h-40 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-2 dark:border-slate-800 dark:bg-slate-950">
          {sessions.length ? (
            <div className="space-y-1">
              {sessions.map((session) => (
                <button
                  type="button"
                  key={session.id}
                  onClick={() => openPreviousChat(session.id)}
                  className="w-full rounded-md px-2 py-1.5 text-left text-xs text-slate-600 hover:bg-white hover:text-blue-700 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-blue-300"
                >
                  <span className="block truncate font-semibold">{session.title}</span>
                  <span className="block text-[11px] text-slate-400">
                    {new Intl.DateTimeFormat(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    }).format(session.updatedAt)}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="px-2 py-3 text-xs text-slate-500 dark:text-slate-400">
              Previous chats will appear here after you start a new chat.
            </div>
          )}
        </div>
      )}
      <div className="grid grid-cols-2 gap-2">
        <TrayAction icon={FileSpreadsheet} label="Workbook" onClick={() => void run(() => loadWorkbook(), 'Workbook loaded')} />
        <TrayAction icon={FileText} label="Document" onClick={() => documentInputRef.current?.click()} />
        <TrayAction icon={FileImage} label="Image" onClick={() => imageInputRef.current?.click()} />
        <TrayAction
          icon={Link2}
          label="URL"
          onClick={() => {
            const url = window.prompt('Paste table URL');
            if (url) void run(() => extractFromURL(url), 'URL preview ready');
          }}
        />
        <TrayAction
          icon={Type}
          label="Text"
          onClick={() => {
            const prompt = window.prompt('Describe the table');
            if (prompt) void run(() => extractFromText(prompt), 'Text preview ready');
          }}
        />
      </div>
      <input
        ref={documentInputRef}
        type="file"
        accept=".pdf,.csv,.xlsx,.xls,.txt,.doc,.docx,application/pdf,text/plain,text/csv"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.currentTarget.value = '';
          if (file) void run(() => extractFromDocument(file), 'Document preview ready');
        }}
      />
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.currentTarget.value = '';
          if (file) void run(async () => extractFromImage(await readAsBase64(file)), 'Image preview ready');
        }}
      />
    </div>
  );
}

function TrayAction({
  icon: Icon,
  label,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-2 rounded-md border border-slate-200 px-2 py-2 text-sm font-medium text-slate-700 hover:border-blue-300 hover:bg-blue-50 dark:border-slate-800 dark:text-slate-200 dark:hover:border-blue-800 dark:hover:bg-blue-950/30"
    >
      <Icon className="h-4 w-4 text-blue-600" />
      {label}
    </button>
  );
}
