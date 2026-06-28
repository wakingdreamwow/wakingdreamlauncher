import { useEffect, useState } from 'react';

interface ServerStatus {
  server_online: boolean;
  players_online: number;
  active_world_bosses?: { eventEntry: number; description: string; length: number }[];
  next_reroll?: string;
}

// Mock until /api/launcher/status is wired
const MOCK_STATUS: ServerStatus = {
  server_online: true,
  players_online: 0,
  active_world_bosses: [],
  next_reroll: 'Wed 07:00 UTC',
};

export function ServerStatus() {
  const [status, setStatus] = useState<ServerStatus | null>(MOCK_STATUS);

  // TODO: fetch('/api/launcher/status') every 30s
  useEffect(() => {
    const t = setInterval(() => {
      // placeholder no-op
    }, 30000);
    return () => clearInterval(t);
  }, []);

  if (!status) return <div className="text-dawn/40">Loading status…</div>;

  return (
    <div className="bg-nightmare/50 border border-smaragd/20 rounded-lg p-5">
      <h2 className="text-lg font-display font-bold text-smaragd-light mb-3">Realm Status</h2>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <div className="text-dawn/40">Server</div>
          <div className={`font-mono ${status.server_online ? 'text-smaragd-light' : 'text-red-400'}`}>
            ● {status.server_online ? 'Online' : 'Offline'}
          </div>
        </div>
        <div>
          <div className="text-dawn/40">Players Online</div>
          <div className="font-mono text-dawn">{status.players_online}</div>
        </div>
      </div>
      {status.active_world_bosses && status.active_world_bosses.length > 0 && (
        <div className="mt-4">
          <div className="text-dawn/40 text-xs mb-1">Active World Bosses</div>
          {status.active_world_bosses.map((b) => (
            <div key={b.eventEntry} className="text-sm text-gold">
              ⚔️ {b.description}
            </div>
          ))}
        </div>
      )}
      {status.next_reroll && (
        <div className="mt-3 text-xs text-dawn/40">
          Next boss reroll: <span className="text-dawn/70">{status.next_reroll}</span>
        </div>
      )}
    </div>
  );
}
