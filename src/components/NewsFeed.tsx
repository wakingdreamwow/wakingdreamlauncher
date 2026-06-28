import { useEffect, useState } from 'react';

interface NewsItem {
  id: number;
  title: string;
  description: string;
  created: string;
  badge?: string;
}

// Mock until /api/launcher/news is wired
const MOCK_NEWS: NewsItem[] = [
  {
    id: 4,
    title: 'Wakingdream Launcher v0.1 released',
    description: 'Initial release with patch sync, realmlist auto-set, and onboarding flow.',
    created: '2026-06-28',
    badge: 'Release',
  },
  {
    id: 3,
    title: 'The Emerald Sentinels questline goes live',
    description:
      'Defeat the Lich King (10/25, normal or heroic) to unlock The Emerald Sentinels — slay all four corrupted Dragon-Sentinels for Activity Tokens, Emblems of Frost, and a chance at custom Emerald-themed drake mounts.',
    created: '2026-06-28',
    badge: 'Content',
  },
  {
    id: 2,
    title: '22 custom world bosses with weekly random spawn windows',
    description:
      'New world bosses across Eastern Kingdoms, Kalimdor, and Northrend. Each spawns once per WoW-week for up to 24 hours — never the same schedule twice.',
    created: '2026-06-26',
    badge: 'Content',
  },
  {
    id: 1,
    title: 'Wakingdream is live',
    description: 'Welcome to a reimagined WoW 3.3.5a experience.',
    created: '2026-06-25',
    badge: 'Launch',
  },
];

function badgeColor(badge?: string) {
  switch (badge) {
    case 'Release': return 'bg-smaragd';
    case 'Content': return 'bg-dream-purple';
    case 'Launch': return 'bg-gold';
    default:        return 'bg-nightmare';
  }
}

export function NewsFeed() {
  const [items, setItems] = useState<NewsItem[]>(MOCK_NEWS);
  const [loading, setLoading] = useState(false);

  // TODO: Wire to fetch('/api/launcher/news') when backend is up
  useEffect(() => {
    setLoading(false);
    setItems(MOCK_NEWS);
  }, []);

  return (
    <div className="bg-nightmare/50 border border-smaragd/20 rounded-lg p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-display font-bold text-smaragd-light">Latest News</h2>
        {loading && <span className="text-xs text-dawn/40">Loading…</span>}
      </div>
      <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
        {items.map((n) => (
          <div key={n.id} className="border-l-2 border-smaragd/40 pl-3 py-1">
            <div className="flex items-center gap-2 mb-1">
              {n.badge && (
                <span className={`text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded ${badgeColor(n.badge)} text-dawn`}>
                  {n.badge}
                </span>
              )}
              <span className="text-xs text-dawn/40 font-mono">{n.created}</span>
            </div>
            <div className="font-medium text-dawn">{n.title}</div>
            <p className="text-sm text-dawn/60 mt-0.5">{n.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
