import { useEffect, useState } from 'react';
import type { LaunchKind, LaunchSpec, LauncherDetection } from '../types';

const LS_KEY = 'wakingdream:launchSpec';

export function loadSavedLaunchSpec(): LaunchSpec | null {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) as LaunchSpec : null;
  } catch {
    return null;
  }
}

export function saveLaunchSpec(spec: LaunchSpec): void {
  localStorage.setItem(LS_KEY, JSON.stringify(spec));
}

interface Props {
  onContinue: (spec: LaunchSpec) => void;
}

interface KindOption {
  kind: LaunchKind;
  title: string;
  blurb: string;
  available: (d: LauncherDetection) => boolean;
  hint?: (d: LauncherDetection) => string | null;
  installUrl?: (d: LauncherDetection) => string | null;
}

const WINE_INSTALL_URL   = 'https://wiki.winehq.org/Download';
const LUTRIS_INSTALL_URL = 'https://lutris.net/downloads';

const OPTIONS: KindOption[] = [
  {
    kind: 'native',
    title: 'Native Windows',
    blurb: 'Run Wow.exe directly. Use this on Windows.',
    available: (d) => d.platform === 'win32',
    hint: (d) => (d.platform !== 'win32' ? 'Only available on Windows' : null),
  },
  {
    kind: 'wine',
    title: 'Wine',
    blurb: 'Run via Wine. Works on Linux and macOS. Simplest setup if you already have Wine.',
    available: (d) => d.wine,
    hint: (d) => (!d.wine ? 'Install: sudo apt install --install-recommends wine' : null),
    installUrl: (d) => (!d.wine ? WINE_INSTALL_URL : null),
  },
  {
    kind: 'lutris-exec',
    title: 'Lutris (Quick-Exec)',
    blurb: 'Use Lutris\'s default Wine configuration. Good if Lutris already manages your Wine prefix.',
    available: (d) => d.lutris,
    hint: (d) => (!d.lutris ? 'Install: sudo apt install lutris' : null),
    installUrl: (d) => (!d.lutris ? LUTRIS_INSTALL_URL : null),
  },
  {
    kind: 'lutris-game',
    title: 'Lutris (Configured Game)',
    blurb: 'Launch a specific Lutris-configured game by slug. Best if you already installed WoW through Lutris.',
    available: (d) => d.lutris,
    hint: (d) => (!d.lutris ? 'Install: sudo apt install lutris' : null),
    installUrl: (d) => (!d.lutris ? LUTRIS_INSTALL_URL : null),
  },
  {
    kind: 'custom',
    title: 'Custom Command',
    blurb: 'Roll your own. Use {wowExe} and {wowDir} placeholders, e.g.  gamemoderun wine {wowExe}',
    available: () => true,
  },
];

export function LaunchMethodScreen({ onContinue }: Props) {
  const [detection, setDetection] = useState<LauncherDetection | null>(null);
  const [kind, setKind] = useState<LaunchKind>('wine');
  const [gameSlug, setGameSlug] = useState('');
  const [command, setCommand] = useState('gamemoderun wine {wowExe}');

  useEffect(() => {
    window.wakingdream.detectLaunchers().then((d) => {
      setDetection(d);
      // Pre-select sensible default
      const saved = loadSavedLaunchSpec();
      if (saved) {
        setKind(saved.kind);
        if (saved.gameSlug) setGameSlug(saved.gameSlug);
        if (saved.command) setCommand(saved.command);
      } else if (d.platform === 'win32') {
        setKind('native');
      } else if (d.lutris) {
        setKind('lutris-exec');
      } else if (d.wine) {
        setKind('wine');
      }
    });
  }, []);

  const finish = () => {
    const spec: LaunchSpec = { kind };
    if (kind === 'lutris-game') spec.gameSlug = gameSlug.trim();
    if (kind === 'custom')      spec.command  = command.trim();
    if (kind === 'lutris-game' && !spec.gameSlug) return;
    if (kind === 'custom'      && !spec.command)  return;
    saveLaunchSpec(spec);
    onContinue(spec);
  };

  if (!detection) {
    return <div className="p-8 text-dawn/50">Detecting available launchers…</div>;
  }

  const needsSetup =
    detection.platform !== 'win32' && !detection.wine && !detection.lutris;

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-3xl font-display font-bold text-smaragd-light mb-2">
        How do you want to launch WoW?
      </h1>
      <p className="text-sm text-dawn/60 mb-6">
        Detected platform: <code className="text-smaragd-light">{detection.platform}</code>
        {detection.platform !== 'win32' && (
          <>
            {' '}· Wine: {detection.wine ? '✓ found' : '✗ missing'}
            {' '}· Lutris: {detection.lutris ? '✓ found' : '✗ missing'}
          </>
        )}
      </p>

      {needsSetup && (
        <div className="mb-6 px-4 py-3 bg-amber-900/30 border border-amber-700/50 rounded-lg text-sm text-amber-100">
          <div className="font-semibold mb-1">Neither Wine nor Lutris is installed on this system.</div>
          <div className="text-amber-200/80 mb-2">
            You need at least one to run a Windows-only 3.3.5a WoW client on Linux.
            Pick whichever you prefer — both are free.
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => window.wakingdream.openExternal(WINE_INSTALL_URL)}
              className="px-3 py-1 text-xs bg-amber-700/40 hover:bg-amber-700/60 border border-amber-600 rounded"
            >
              Install Wine ↗
            </button>
            <button
              onClick={() => window.wakingdream.openExternal(LUTRIS_INSTALL_URL)}
              className="px-3 py-1 text-xs bg-amber-700/40 hover:bg-amber-700/60 border border-amber-600 rounded"
            >
              Install Lutris ↗
            </button>
            <span className="text-[10px] text-amber-200/60 self-center">
              After installing, restart the launcher to re-detect.
            </span>
          </div>
        </div>
      )}

      <div className="space-y-3 mb-6">
        {OPTIONS.map((opt) => {
          const available = opt.available(detection);
          const hint = opt.hint?.(detection);
          const installUrl = opt.installUrl?.(detection);
          const selected = kind === opt.kind;
          return (
            <div
              key={opt.kind}
              role="radio"
              aria-checked={selected}
              tabIndex={available ? 0 : -1}
              onClick={() => available && setKind(opt.kind)}
              onKeyDown={(e) => {
                if (!available) return;
                if (e.key === ' ' || e.key === 'Enter') {
                  e.preventDefault();
                  setKind(opt.kind);
                }
              }}
              className={`block border rounded-lg p-4 transition ${
                selected ? 'border-smaragd bg-smaragd/10' : 'border-smaragd/20 hover:bg-smaragd/5'
              } ${!available ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className="flex items-start gap-3">
                <input
                  type="radio"
                  name="launch-kind"
                  checked={selected}
                  onChange={() => setKind(opt.kind)}
                  onClick={(e) => e.stopPropagation()}
                  disabled={!available}
                  className="mt-1 accent-smaragd pointer-events-none"
                  tabIndex={-1}
                />
                <div className="flex-1">
                  <div className="font-medium text-dawn">{opt.title}</div>
                  <p className="text-xs text-dawn/60 mt-0.5">{opt.blurb}</p>
                  {hint && (
                    <p className="text-[11px] text-amber-300 mt-1 font-mono">{hint}</p>
                  )}
                  {installUrl && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        window.wakingdream.openExternal(installUrl);
                      }}
                      className="mt-1 text-[11px] text-amber-200 underline hover:text-amber-100"
                    >
                      Open install page ↗
                    </button>
                  )}
                  {selected && opt.kind === 'lutris-game' && (
                    <input
                      type="text"
                      placeholder='Lutris game slug, e.g. "world-of-warcraft"'
                      value={gameSlug}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => setGameSlug(e.target.value)}
                      className="mt-2 w-full px-3 py-1.5 text-sm bg-nightmare/70 border border-smaragd/30 rounded text-dawn focus:border-smaragd-light focus:outline-none"
                    />
                  )}
                  {selected && opt.kind === 'custom' && (
                    <input
                      type="text"
                      placeholder="e.g. gamemoderun wine {wowExe}"
                      value={command}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => setCommand(e.target.value)}
                      className="mt-2 w-full px-3 py-1.5 text-sm font-mono bg-nightmare/70 border border-smaragd/30 rounded text-dawn focus:border-smaragd-light focus:outline-none"
                    />
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <button
        onClick={finish}
        disabled={
          (kind === 'lutris-game' && !gameSlug.trim()) ||
          (kind === 'custom'      && !command.trim())
        }
        className="py-3 bg-gradient-to-r from-smaragd to-smaragd-light text-dawn font-display font-bold text-lg rounded-lg hover:shadow-smaragd/50 transition disabled:opacity-50"
      >
        Continue
      </button>
      <p className="text-[11px] text-dawn/40 mt-2 text-center">
        You can change this later under Settings.
      </p>
    </div>
  );
}
