import { useEffect, useState } from 'react';

export function PatchSyncScreen({ wowDir, onDone }: { wowDir: string; onDone: () => void }) {
  const [status, setStatus] = useState<'loading' | 'no-patches' | 'syncing' | 'done' | 'error'>('loading');
  const [manifest, setManifest] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const m = await window.wakingdream.fetchManifest();
        setManifest(m);
        if (!m.patches || m.patches.length === 0) {
          setStatus('no-patches');
          // Auto-advance: set realmlist then continue
          await window.wakingdream.setRealmlist(wowDir, m.realm_address || 'wakingdream.cc');
        }
      } catch (e) {
        setError(String(e));
        setStatus('error');
      }
    })();
  }, [wowDir]);

  return (
    <div className="h-full flex flex-col items-center justify-center p-10 text-center">
      <h2 className="text-2xl font-display font-bold mb-4">Patch Sync</h2>
      {status === 'loading' && <p className="text-dawn/70">Fetching manifest…</p>}
      {status === 'no-patches' && (
        <>
          <p className="text-dawn/70 mb-4">No custom patches required right now.<br />Realmlist configured.</p>
          <button onClick={onDone} className="px-8 py-3 bg-smaragd hover:bg-smaragd-light rounded-lg font-semibold">
            Continue
          </button>
        </>
      )}
      {status === 'error' && (
        <div className="text-red-300">
          <p>Could not reach patches server.</p>
          <code className="text-xs">{error}</code>
        </div>
      )}
      {manifest && (
        <div className="mt-6 text-xs text-dawn/40">
          Manifest version: <code>{manifest.version}</code>
        </div>
      )}
    </div>
  );
}
