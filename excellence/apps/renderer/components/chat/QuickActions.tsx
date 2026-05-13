import { FileImage, Link2, Plus, Table2, Type } from 'lucide-react';

interface QuickActionsProps {
  disabled?: boolean;
  onImage: () => void;
  onUrl: () => void;
  onText: () => void;
}

export function QuickActions({
  disabled = false,
  onImage,
  onUrl,
  onText,
}: QuickActionsProps) {
  const actions = [
    {
      label: 'Image',
      description: 'Extract a photographed table',
      icon: FileImage,
      onClick: onImage,
      tone: 'text-blue-700 bg-blue-50 dark:bg-blue-950/30 dark:text-blue-300',
    },
    {
      label: 'URL',
      description: 'Scrape a web table',
      icon: Link2,
      onClick: onUrl,
      tone: 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-300',
    },
    {
      label: 'Text',
      description: 'Describe rows to create',
      icon: Type,
      onClick: onText,
      tone: 'text-amber-700 bg-amber-50 dark:bg-amber-950/30 dark:text-amber-300',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
      {actions.map((action) => {
        const Icon = action.icon;

        return (
          <button
            type="button"
            key={action.label}
            onClick={action.onClick}
            disabled={disabled}
            className="group flex min-h-24 flex-col justify-between rounded-lg border border-slate-200 bg-white p-3 text-left transition-colors hover:border-blue-300 hover:bg-blue-50/40 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-800 dark:hover:bg-blue-950/20"
          >
            <div className="flex items-center justify-between">
              <span className={`rounded-md p-2 ${action.tone}`}>
                <Icon className="h-5 w-5" />
              </span>
              <Plus className="h-4 w-4 text-slate-300 transition-colors group-hover:text-blue-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">{action.label}</p>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                {action.description}
              </p>
            </div>
          </button>
        );
      })}
    </div>
  );
}
