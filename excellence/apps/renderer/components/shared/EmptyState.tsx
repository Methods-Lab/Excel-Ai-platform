import {
  FileSpreadsheet,
  FileText,
  Inbox,
  MessageSquare,
  Search,
  type LucideIcon,
} from 'lucide-react';

type EmptyStateIcon = 'workbook' | 'document' | 'chat' | 'search' | 'inbox';

interface EmptyStateProps {
  icon?: EmptyStateIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const icons: Record<EmptyStateIcon, LucideIcon> = {
  workbook: FileSpreadsheet,
  document: FileText,
  chat: MessageSquare,
  search: Search,
  inbox: Inbox,
};

export function EmptyState({
  icon = 'inbox',
  title,
  description,
  action,
}: EmptyStateProps) {
  const Icon = icons[icon];

  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-white px-4 py-6 text-center dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-3 rounded-md bg-slate-100 p-2 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{title}</h3>
      <p className="mt-1 max-w-56 text-xs leading-5 text-slate-500 dark:text-slate-400">
        {description}
      </p>
      {action && (
        <button
          type="button"
          onClick={action.onClick}
          className="mt-4 inline-flex items-center justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
