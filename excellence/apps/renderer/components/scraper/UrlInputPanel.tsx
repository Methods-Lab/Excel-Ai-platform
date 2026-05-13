import { FormEvent, useState } from 'react';
import { Link2, Loader2 } from 'lucide-react';

interface UrlInputPanelProps {
  isLoading?: boolean;
  onSubmit: (url: string) => void;
}

export function UrlInputPanel({ isLoading = false, onSubmit }: UrlInputPanelProps) {
  const [url, setUrl] = useState('');

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const trimmed = url.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
      <label htmlFor="scraper-url" className="text-sm font-semibold text-slate-900 dark:text-white">
        Table URL
      </label>
      <div className="mt-2 flex gap-2">
        <div className="relative min-w-0 flex-1">
          <Link2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            id="scraper-url"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://example.com/table"
            className="w-full rounded-md border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-700 dark:bg-slate-950"
          />
        </div>
        <button
          type="submit"
          disabled={isLoading || !url.trim()}
          className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-blue-300"
        >
          {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
          Extract
        </button>
      </div>
    </form>
  );
}
