import { useEffect, useState } from 'react';
import { NewsFeed } from '../components/NewsFeed';
import { ServerStatus } from '../components/ServerStatus';
import { RegisterForm } from '../components/RegisterForm';
import { AddonsTab } from '../components/AddonsTab';
import { LaunchMethodScreen } from './LaunchMethodScreen';
import type { LaunchSpec } from '../types';
import logo from '../assets/logo/wakingdream-logo.png';

type Tab = 'home' | 'addons' | 'settings';

interface Props {
  wowDir: string;
  launchSpec: LaunchSpec;
  onSpecChange: (spec: LaunchSpec) => void;
}

export function MainScreen({ wowDir, launchSpec, onSpecChange }: Props) {
  const [launching, setLaunching] = useState(false);
  const [launchError, setLaunchError] = useState<string | null>(null);
  const [showRegister, setShowRegister] = useState(false);
  const [tab, setTab] = useState<Tab>('home');

  // Clear stale launch errors whenever the user picks a different launch method.
  useEffect(() => {
    setLaunchError(null);
  }, [launchSpec.kind, launchSpec.gameSlug, launchSpec.command]);

  const play = async () => {
    setLaunching(true);
    setLaunchError(null);
    try {
      await window.wakingdream.setRealmlist(wowDir, 'wakingdream.cc');
      await window.wakingdream.launchWow(wowDir, launchSpec);
    } catch (e: any) {
      setLaunchError(String(e?.message ?? e));
    } finally {
      setTimeout(() => setLaunching(false), 2000);
    }
  };

  const launchSummary = (() => {
    switch (launchSpec.kind) {
      case 'native':       return 'Native (Wow.exe directly)';
      case 'wine':         return 'Wine';
      case 'lutris-exec':  return 'Lutris (quick-exec)';
      case 'lutris-game':  return `Lutris game: ${launchSpec.gameSlug ?? '(unset)'}`;
      case 'custom':       return `Custom: ${launchSpec.command ?? '(unset)'}`;
    }
  })();

  return (
    <div className="h-full flex flex-col p-8">
      <div className="flex justify-between items-start mb-6">
        <div className="flex items-center gap-4">
          <img src={logo} alt="" className="w-14 h-14 object-contain drop-shadow-[0_0_12px_rgba(76,175,80,0.35)]" />
          <div>
            <h1 className="text-3xl font-display font-bold text-smaragd-light">Wakingdream</h1>
            <p className="text-xs text-dawn/40 mt-1 font-mono">{wowDir}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowRegister(true)} className="px-3 py-1.5 text-sm border border-smaragd/40 hover:bg-smaragd/10 rounded">
            Create Account
          </button>
        </div>
      </div>

      <div className="flex gap-1 mb-4 border-b border-smaragd/20">
        {([
          ['home', 'Home'],
          ['addons', 'Addons'],
          ['settings', 'Settings'],
        ] as [Tab, string][]).map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`px-4 py-2 text-sm font-medium transition ${
              tab === id ? 'border-b-2 border-smaragd text-smaragd-light' : 'text-dawn/60 hover:text-dawn'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex-1 min-h-0">
        {tab === 'home' && (
          <div className="grid grid-cols-2 gap-4 h-full">
            <NewsFeed />
            <ServerStatus />
          </div>
        )}
        {tab === 'addons' && <AddonsTab wowDir={wowDir} />}
        {tab === 'settings' && (
          <div className="h-full overflow-y-auto pr-2">
            <div className="text-dawn/60 p-6 bg-nightmare/50 border border-smaragd/20 rounded-lg">
              <h2 className="font-display font-bold text-smaragd-light mb-3">Launch Method</h2>
              <p className="text-xs text-dawn/60 mb-3">
                Currently: <code className="text-smaragd-light">{launchSummary}</code>
              </p>
              <LaunchMethodScreen onContinue={(spec) => { onSpecChange(spec); setTab('home'); }} />
            </div>
          </div>
        )}
      </div>

      {launchError && (
        <div className="mt-3 px-3 py-2 bg-red-900/40 border border-red-700 rounded text-sm text-red-200 whitespace-pre-wrap font-mono text-xs relative">
          <button
            onClick={() => setLaunchError(null)}
            title="Dismiss"
            className="absolute top-1 right-2 text-red-300 hover:text-red-100 text-base leading-none"
          >
            ×
          </button>
          <div className="pr-6">{launchError}</div>
        </div>
      )}

      <button
        onClick={play}
        disabled={launching}
        className="mt-6 w-full py-4 bg-gradient-to-r from-smaragd to-smaragd-light text-dawn font-display font-bold text-xl rounded-lg shadow-2xl hover:shadow-smaragd/50 transition disabled:opacity-50"
      >
        {launching ? 'Launching…' : `PLAY  ·  ${launchSummary}`}
      </button>

      {showRegister && <RegisterForm onClose={() => setShowRegister(false)} />}
    </div>
  );
}
