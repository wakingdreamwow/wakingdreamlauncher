import { useEffect, useState } from 'react';
import type { UpdaterEvent } from '../types';

function fmtBytes(n?: number): string {
  if (!n) return '0';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

export function UpdateBanner() {
  const [event, setEvent] = useState<UpdaterEvent | null>(null);

  useEffect(() => {
    return window.wakingdream.onUpdaterEvent(setEvent);
  }, []);

  if (!event) return null;

  // Only show banner for meaningful phases. 'none' and 'checking' stay quiet.
  switch (event.phase) {
    case 'checking':
    case 'none':
      return null;

    case 'available':
      return (
        <div className="mx-8 mt-3 px-3 py-2 bg-smaragd/20 border border-smaragd/40 rounded text-sm text-dawn flex items-center justify-between gap-3">
          <span>Update <code className="text-smaragd-light">{event.version}</code> available — downloading…</span>
        </div>
      );

    case 'downloading':
      return (
        <div className="mx-8 mt-3 px-3 py-2 bg-smaragd/20 border border-smaragd/40 rounded text-sm text-dawn">
          <div className="flex items-center justify-between gap-3 mb-1">
            <span>Downloading update {event.version ? `${event.version}` : ''}…</span>
            <span className="font-mono text-xs">
              {fmtBytes(event.transferred)} / {fmtBytes(event.total)}
              {event.bps ? ` · ${fmtBytes(event.bps)}/s` : ''}
            </span>
          </div>
          <div className="h-1 bg-nightmare rounded overflow-hidden">
            <div className="h-full bg-smaragd-light transition-all" style={{ width: `${Math.round(event.percent ?? 0)}%` }} />
          </div>
        </div>
      );

    case 'ready':
      return (
        <div className="mx-8 mt-3 px-3 py-2 bg-gold/20 border border-gold/50 rounded text-sm text-dawn flex items-center justify-between gap-3">
          <span>Update <code className="text-gold">{event.version}</code> ready. Restart to apply.</span>
          <button
            onClick={() => window.wakingdream.quitAndInstallUpdate()}
            className="px-3 py-1 bg-gold text-nightmare font-semibold rounded text-xs hover:bg-gold/80"
          >
            Restart now
          </button>
        </div>
      );

    case 'error':
      return (
        <div className="mx-8 mt-3 px-3 py-2 bg-red-900/40 border border-red-700 rounded text-xs text-red-200 font-mono">
          Update check failed: {event.error}
        </div>
      );

    default:
      return null;
  }
}
