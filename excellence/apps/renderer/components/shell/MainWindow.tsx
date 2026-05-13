import { ChatView } from '../chat/ChatView';
import { PreviewModal } from '../preview/PreviewModal';
import { useExtractionStore } from '../../stores/extractionStore';
import { Sidebar } from './Sidebar';

export function MainWindow() {
  const isPreviewOpen = useExtractionStore((state) => state.isPreviewOpen);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <div className="hidden w-72 flex-shrink-0 border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 lg:block">
        <Sidebar />
      </div>
      <main className="min-w-0 flex-1">
        <ChatView />
      </main>
      {isPreviewOpen && (
        <div className="hidden w-[min(760px,48vw)] flex-shrink-0 border-l border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950 md:block">
          <PreviewModal />
        </div>
      )}
      {isPreviewOpen && (
        <div className="fixed inset-0 z-30 bg-white dark:bg-slate-950 md:hidden">
          <PreviewModal />
        </div>
      )}
    </div>
  );
}
