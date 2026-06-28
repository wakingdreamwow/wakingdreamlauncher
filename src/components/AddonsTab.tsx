import { useState } from 'react';
import { CURATED_ADDONS, CuratedAddon } from '../data/addons';

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

export function AddonsTab({ wowDir }: { wowDir: string }) {
  const [selected, setSelected] = useState<Set<string>>(
    new Set(CURATED_ADDONS.filter((a) => a.recommended).map((a) => a.id))
  );
  const [installing, setInstalling] = useState(false);
  const [installed, setInstalled] = useState<Set<string>>(new Set());

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const installSelected = async () => {
    setInstalling(true);
    // TODO: wire IPC to main process that downloads & extracts zips into wowDir/Interface/AddOns/
    // For now: simulate
    for (const id of selected) {
      await new Promise((r) => setTimeout(r, 300));
      setInstalled((prev) => new Set(prev).add(id));
    }
    setInstalling(false);
  };

  const totalKb = Array.from(selected).reduce((sum, id) => {
    const addon = CURATED_ADDONS.find((a) => a.id === id);
    return sum + (addon?.size_kb ?? 0);
  }, 0);

  // Group by category
  const grouped: Record<string, CuratedAddon[]> = {};
  for (const addon of CURATED_ADDONS) {
    (grouped[addon.category] ||= []).push(addon);
  }

  return (
    <div className="bg-nightmare/50 border border-smaragd/20 rounded-lg p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-display font-bold text-smaragd-light">Curated Addons</h2>
        <div className="text-xs text-dawn/40">
          {selected.size} selected · {formatSize(totalKb)}
        </div>
      </div>

      <div className="space-y-4 max-h-96 overflow-y-auto pr-1">
        {Object.entries(grouped).map(([cat, addons]) => (
          <div key={cat}>
            <div className="text-xs font-semibold text-smaragd-light uppercase mb-2 tracking-wide">
              {CATEGORY_LABELS[cat as CuratedAddon['category']]}
            </div>
            <div className="space-y-1.5">
              {addons.map((addon) => (
                <label
                  key={addon.id}
                  className={`flex items-start gap-3 p-2 rounded hover:bg-smaragd/5 cursor-pointer ${
                    installed.has(addon.id) ? 'opacity-60' : ''
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selected.has(addon.id)}
                    onChange={() => toggle(addon.id)}
                    disabled={installed.has(addon.id)}
                    className="mt-1 accent-smaragd"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-dawn">{addon.name}</span>
                      {addon.recommended && (
                        <span className="text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-gold/80 text-nightmare">
                          recommended
                        </span>
                      )}
                      {installed.has(addon.id) && (
                        <span className="text-[10px] font-bold text-smaragd-light">✓ installed</span>
                      )}
                    </div>
                    <p className="text-xs text-dawn/50">{addon.description}</p>
                  </div>
                  <span className="text-xs text-dawn/40 font-mono shrink-0">{formatSize(addon.size_kb)}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 flex justify-between items-center">
        <div className="text-xs text-dawn/40">
          Installs into <code className="text-smaragd-light">{wowDir.length > 40 ? '…' + wowDir.slice(-40) : wowDir}/Interface/AddOns/</code>
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
