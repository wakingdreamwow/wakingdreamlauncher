import { useEffect, useState } from 'react';
import { api, NewsItem } from '../lib/api';

function badgeFromCategory(cat?: string): { label: string; color: string } {
  switch ((cat ?? '').toLowerCase()) {
    case 'order_failure': return { label: 'Issue',    color: 'bg-red-700' };
    case 'exploit':       return { label: 'Exploit',  color: 'bg-red-800' };
    case 'technical':     return { label: 'Tech',     color: 'bg-dream-purple' };
    case 'dungeon':       return { label: 'Dungeon',  color: 'bg-dream-purple' };
    case 'content':       return { label: 'Content',  color: 'bg-dream-purple' };
    case 'release':       return { label: 'Release',  color: 'bg-smaragd' };
    case 'launch':        return { label: 'Launch',   color: 'bg-gold' };
    default:              return { label: cat ? cat[0].toUpperCase() + cat.slice(1) : 'News', color: 'bg-nightmare' };
  }
}

function relTime(unixOrIso: string): string {
  let ms: number;
  if (/^\d+$/.test(unixOrIso)) {
    ms = parseInt(unixOrIso, 10) * 1000;
  } else {
    ms = new Date(unixOrIso).getTime();
  }
  if (!ms || isNaN(ms)) return '';
  const diff = (Date.now() - ms) / 1000;
  if (diff < 60)        return 'just now';
  if (diff < 3600)      return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400)     return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 86400 * 7) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(ms).toLocaleDateString();
}

export function NewsFeed() {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    api.news()
      .then((res) => { if (!cancelled) setItems(res.items ?? []); })
      .catch((e) => { if (!cancelled) setError(String(e.message ?? e)); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="bg-nightmare/50 border border-smaragd/20 rounded-lg p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-display font-bold text-smaragd-light">Latest News</h2>
        {loading && <span className="text-xs text-dawn/40">Loading…</span>}
      </div>

      {error && (
        <div className="text-sm text-red-300 bg-red-900/30 border border-red-700 rounded p-2 mb-3">
          {error}
        </div>
      )}

      {!loading && !error && items.length === 0 && (
        <div className="text-sm text-dawn/40 italic">No news yet.</div>
      )}

      <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
        {items.map((n) => {
          const badge = badgeFromCategory(n.category);
          return (
            <div key={n.id} className="border-l-2 border-smaragd/40 pl-3 py-1">
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded ${badge.color} text-dawn`}>
                  {badge.label}
                </span>
                <span className="text-xs text-dawn/40 font-mono">{relTime(n.created_at)}</span>
                {n.status && n.status !== 'open' && (
                  <span className="text-[10px] text-dawn/40 uppercase">{n.status}</span>
                )}
              </div>
              <div className="font-medium text-dawn">{n.title}</div>
              <p className="text-sm text-dawn/60 mt-0.5 line-clamp-2">{n.description}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
