import { useEffect, useState } from 'react';
import { api, ServerStatusPayload } from '../lib/api';

const POLL_MS = 30_000;

export function ServerStatus() {
  const [status, setStatus] = useState<ServerStatusPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = () => {
      api.status()
        .then((s) => {
          if (cancelled) return;
          setStatus(s);
          setError(null);
          setLastUpdated(new Date());
        })
        .catch((e) => { if (!cancelled) setError(String(e.message ?? e)); });
    };
    load();
    const t = setInterval(load, POLL_MS);
    return () => { cancelled = true; clearInterval(t); };
  }, []);

  if (!status && !error) {
    return (
      <div className="bg-nightmare/50 border border-smaragd/20 rounded-lg p-5 text-dawn/40">
        Loading status…
      </div>
    );
  }

  const online = status?.server_online ?? false;

  return (
    <div className="bg-nightmare/50 border border-smaragd/20 rounded-lg p-5">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-display font-bold text-smaragd-light">Realm Status</h2>
        {lastUpdated && (
          <span className="text-[10px] text-dawn/40 font-mono">
            {lastUpdated.toLocaleTimeString()}
          </span>
        )}
      </div>

      {error && (
        <div className="text-sm text-red-300 bg-red-900/30 border border-red-700 rounded p-2 mb-3">
          {error}
        </div>
      )}

      {status && (
        <>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <div className="text-dawn/40">Server</div>
              <div className={`font-mono ${online ? 'text-smaragd-light' : 'text-red-400'}`}>
                ● {online ? 'Online' : 'Offline'}
              </div>
              {status.realm_name && (
                <div className="text-xs text-dawn/40 mt-0.5">{status.realm_name}</div>
              )}
            </div>
            <div>
              <div className="text-dawn/40">Players Online</div>
              <div className="font-mono text-dawn">{status.players_online}</div>
            </div>
          </div>

          {status.active_world_bosses && status.active_world_bosses.length > 0 ? (
            <div className="mt-4">
              <div className="text-dawn/40 text-xs mb-1">Active World Bosses</div>
              <ul className="space-y-0.5">
                {status.active_world_bosses.map((b) => (
                  <li key={b.eventEntry} className="text-sm text-gold">
                    ⚔️ {b.description}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="mt-4 text-xs text-dawn/40 italic">
              No world bosses up right now.
            </div>
          )}

          {status.next_reroll && (
            <div className="mt-3 text-xs text-dawn/40">
              Next boss reroll: <span className="text-dawn/70">{status.next_reroll}</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
