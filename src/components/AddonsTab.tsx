import { useEffect, useMemo, useState } from 'react';
import { CURATED_ADDONS, CuratedAddon } from '../data/addons';
import type { AddonInstallProgress, InstalledAddon } from '../types';

const CATEGORY_LABELS: Record<CuratedAddon['category'], string> = {
  combat: 'Combat',
  ui: 'UI',
  chat: 'Chat',
  ah: 'Auction House',
  questing: 'Questing & Loot',
  social: 'Social',
  wakingdream: 'Wakingdream',
};

function formatSize(kb: number) {
  if (kb < 1024) return `${kb} KB`;
  return `${(kb / 1024).toFixed(1)} MB`;
}

function pct(done?: number, total?: number) {
  if (!done || !total) return 0;
  return Math.min(100, Math.round((done / total) * 100));
}

export function AddonsTab({ wowDir }: { wowDir: string }) {
  const [selected, setSelected] = useState<Set<string>>(
    new Set(CURATED_ADDONS.filter((a) => a.recommended).map((a) => a.id)),
  );
  const [installing, setInstalling] = useState(false);
  const [installed, setInstalled] = useState<Record<string, InstalledAddon>>({});
  const [progress, setProgress] = useState<AddonInstallProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load existing install state on mount + subscribe to live progress
  useEffect(() => {
    window.wakingdream
      .listInstalledAddons()
      .then(setInstalled)
      .catch(() => { /* first run, state file may not exist */ });
    const off = window.wakingdream.onAddonProgress((p) => {
      setProgress(p);
      if (p.phase === 'error') setError(p.error ?? 'install error');
    });
    return off;
  }, []);

  const toggle = (id: string) => {
    if (installed[id]) return; // installed — go through uninstall path
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const installSelected = async () => {
    const specs = CURATED_ADDONS
      .filter((a) => selected.has(a.id) && !installed[a.id])
      .map((a) => ({ id: a.id, name: a.name, zip_url: a.zip_url, installs_to: a.installs_to }));
    if (specs.length === 0) return;

    setInstalling(true);
    setError(null);
    try {
      const results = await window.wakingdream.installAddons(wowDir, specs);
      const firstErr = results.find((r) => r.error);
      if (firstErr) setError(`${firstErr.id}: ${firstErr.error}`);
      const next = await window.wakingdream.listInstalledAddons();
      setInstalled(next);
      setSelected(new Set());
    } catch (e: any) {
      setError(String(e?.message ?? e));
    } finally {
      setInstalling(false);
      setProgress(null);
    }
  };

  const removeInstalled = async (a: CuratedAddon) => {
    if (!confirm(`Uninstall ${a.name}?`)) return;
    try {
      await window.wakingdream.uninstallAddon(wowDir, a.id, a.installs_to);
      const next = await window.wakingdream.listInstalledAddons();
      setInstalled(next);
    } catch (e: any) {
      setError(String(e?.message ?? e));
    }
  };

  const totalKb = useMemo(
    () =>
      Array.from(selected).reduce((sum, id) => {
        const addon = CURATED_ADDONS.find((a) => a.id === id);
        return sum + (addon?.size_kb ?? 0);
      }, 0),
    [selected],
  );

  const grouped: Record<string, CuratedAddon[]> = {};
  for (const addon of CURATED_ADDONS) {
    (grouped[addon.category] ||= []).push(addon);
  }

  return (
    <div className="h-full flex flex-col bg-nightmare/50 border border-smaragd/20 rounded-lg p-5 min-h-0">
      <div className="flex items-center justify-between mb-4 shrink-0">
        <h2 className="text-lg font-display font-bold text-smaragd-light">Curated Addons</h2>
        <div className="text-xs text-dawn/40">
          {selected.size} selected · {formatSize(totalKb)}
          {' · '}{Object.keys(installed).length} installed
        </div>
      </div>

      {error && (
        <div className="mb-3 px-3 py-2 bg-red-900/40 border border-red-700 rounded text-sm text-red-200 shrink-0">
          {error}
        </div>
      )}

      <div className="flex-1 min-h-0 space-y-4 overflow-y-auto pr-2">
        {Object.entries(grouped).map(([cat, addons]) => (
          <div key={cat}>
            <div className="text-xs font-semibold text-smaragd-light uppercase mb-2 tracking-wide">
              {CATEGORY_LABELS[cat as CuratedAddon['category']]}
            </div>
            <div className="space-y-1.5">
              {addons.map((addon) => {
                const isInstalled = Boolean(installed[addon.id]);
                const isCurrent = progress?.id === addon.id && installing;
                return (
                  <div
                    key={addon.id}
                    className={`flex items-start gap-3 p-2 rounded hover:bg-smaragd/5 ${
                      isInstalled ? 'opacity-80' : ''
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isInstalled || selected.has(addon.id)}
                      onChange={() => toggle(addon.id)}
                      disabled={isInstalled || installing}
                      className="mt-1 accent-smaragd"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-dawn">{addon.name}</span>
                        {addon.recommended && !isInstalled && (
                          <span className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-gold/80 text-nightmare">
                            recommended
                          </span>
                        )}
                        {isInstalled && (
                          <span className="text-[10px] font-bold text-smaragd-light">✓ installed</span>
                        )}
                      </div>
                      <p className="text-xs text-dawn/50">{addon.description}</p>
                      {isCurrent && (
                        <div className="mt-1.5">
                          <div className="h-1 bg-nightmare rounded overflow-hidden">
                            <div
                              className="h-full bg-smaragd-light transition-all"
                              style={{
                                width:
                                  progress?.phase === 'extracting'
                                    ? '100%'
                                    : `${pct(progress?.bytes_done, progress?.bytes_total)}%`,
                              }}
                            />
                          </div>
                          <div className="text-[10px] text-dawn/40 mt-0.5 font-mono">
                            {progress?.phase}
                            {progress?.bytes_total
                              ? ` — ${pct(progress.bytes_done, progress.bytes_total)}%`
                              : ''}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className="text-xs text-dawn/40 font-mono">{formatSize(addon.size_kb)}</span>
                      {isInstalled && !installing && (
                        <button
                          onClick={() => removeInstalled(addon)}
                          className="text-[10px] text-red-300 hover:text-red-200 underline"
                        >
                          uninstall
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 flex justify-between items-center shrink-0">
        <div className="text-xs text-dawn/40">
          Installs into{' '}
          <code className="text-smaragd-light">
            {wowDir.length > 40 ? '…' + wowDir.slice(-40) : wowDir}/Interface/AddOns/
          </code>
        </div>
        <button
          onClick={installSelected}
          disabled={installing || selected.size === 0}
          className="px-6 py-2 bg-smaragd hover:bg-smaragd-light rounded font-semibold disabled:opacity-50"
        >
          {installing ? 'Installing…' : `Install ${selected.size} Selected`}
        </button>
      </div>
    </div>
  );
}
