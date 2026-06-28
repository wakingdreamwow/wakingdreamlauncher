import { useEffect, useState, useRef } from 'react';

type SyncProgress = {
  phase: 'manifest' | 'check' | 'downloading' | 'verifying' | 'installing' | 'done';
  current_patch?: string;
  current_index?: number;
  total_patches?: number;
  bytes_done?: number;
  bytes_total?: number;
  speed_bps?: number;
  message?: string;
};

function formatBytes(b: number): string {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  if (b < 1024 * 1024 * 1024) return `${(b / 1024 / 1024).toFixed(1)} MB`;
  return `${(b / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

function formatSpeed(bps: number): string {
  return `${formatBytes(bps)}/s`;
}

export function PatchSyncScreen({ wowDir, onDone }: { wowDir: string; onDone: () => void }) {
  const [progress, setProgress] = useState<SyncProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [phase, setPhase] = useState<'fetching' | 'syncing' | 'done' | 'error'>('fetching');
  const unsubRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        // Subscribe to progress events from main
        unsubRef.current = window.wakingdream.onPatchProgress((p: SyncProgress) => {
          if (!cancelled) setProgress(p);
        });

        setPhase('syncing');
        const result = await window.wakingdream.syncPatches(wowDir);
        if (cancelled) return;

        // Set realmlist as part of onboarding
        const realmHost = result?.manifest?.realm_address ?? 'wakingdream.cc';
        await window.wakingdream.setRealmlist(wowDir, realmHost);

        setPhase('done');
      } catch (e) {
        if (!cancelled) {
          setError(String(e));
          setPhase('error');
        }
      }
    })();

    return () => {
      cancelled = true;
      unsubRef.current?.();
    };
  }, [wowDir]);

  const pct =
    progress?.bytes_done && progress?.bytes_total
      ? Math.round((progress.bytes_done / progress.bytes_total) * 100)
      : 0;

  return (
    <div className="h-full flex flex-col items-center justify-center p-10">
      <h2 className="text-2xl font-display font-bold mb-2">Syncing Patches</h2>
      <p className="text-dawn/70 mb-8 text-sm">
        Downloading custom assets from <code className="text-smaragd-light">patches.wakingdream.cc</code>
      </p>

      {/* Phase indicator + message */}
      <div className="w-full max-w-lg">
        {phase === 'fetching' && (
          <div className="text-center text-dawn/60">Fetching manifest…</div>
        )}

        {phase === 'syncing' && progress && (
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-dawn/80 font-medium">{progress.message ?? progress.phase}</div>
              {progress.current_patch && (
                <div className="text-xs text-dawn/50 mt-1">
                  {progress.current_index ?? '?'} / {progress.total_patches ?? '?'}: {progress.current_patch}
                </div>
              )}
            </div>

            {progress.phase === 'downloading' && progress.bytes_total ? (
              <>
                <div className="w-full bg-nightmare/70 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-smaragd to-smaragd-light transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-dawn/40 font-mono">
                  <span>
                    {formatBytes(progress.bytes_done ?? 0)} / {formatBytes(progress.bytes_total)}
                  </span>
                  <span>{pct}%</span>
                  <span>{formatSpeed(progress.speed_bps ?? 0)}</span>
                </div>
              </>
            ) : null}
          </div>
        )}

        {phase === 'error' && (
          <div className="mt-6 px-4 py-3 bg-red-900/40 border border-red-700 rounded text-sm text-red-200">
            <div className="font-medium mb-1">Sync failed</div>
            <code className="text-xs break-all">{error}</code>
            <div className="mt-3">
              <button
                onClick={onDone}
                className="px-4 py-2 bg-smaragd hover:bg-smaragd-light rounded text-sm"
              >
                Continue anyway
              </button>
            </div>
          </div>
        )}

        {phase === 'done' && (
          <div className="text-center space-y-4">
            <div className="text-smaragd-light text-lg">✓ {progress?.message ?? 'All patches in sync.'}</div>
            <button
              onClick={onDone}
              className="px-8 py-3 bg-smaragd hover:bg-smaragd-light text-dawn font-semibold rounded-lg shadow-lg transition"
            >
              Continue
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
