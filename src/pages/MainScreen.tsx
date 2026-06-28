import { useState } from 'react';
import { NewsFeed } from '../components/NewsFeed';
import { ServerStatus } from '../components/ServerStatus';
import { RegisterForm } from '../components/RegisterForm';
import { AddonsTab } from '../components/AddonsTab';

type Tab = 'home' | 'addons' | 'settings';

export function MainScreen({ wowDir }: { wowDir: string }) {
  const [launching, setLaunching] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [tab, setTab] = useState<Tab>('home');

  const play = async () => {
    setLaunching(true);
    try {
      await window.wakingdream.setRealmlist(wowDir, 'wakingdream.cc');
      await window.wakingdream.launchWow(wowDir);
    } finally {
      setTimeout(() => setLaunching(false), 2000);
    }
  };

  return (
    <div className="h-full flex flex-col p-8">
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-3xl font-display font-bold text-smaragd-light">Wakingdream</h1>
          <p className="text-xs text-dawn/40 mt-1 font-mono">{wowDir}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowRegister(true)} className="px-3 py-1.5 text-sm border border-smaragd/40 hover:bg-smaragd/10 rounded">
            Create Account
          </button>
        </div>
      </div>

      {/* Tab Bar */}
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

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {tab === 'home' && (
          <div className="grid grid-cols-2 gap-4 h-full">
            <NewsFeed />
            <ServerStatus />
          </div>
        )}
        {tab === 'addons' && <AddonsTab wowDir={wowDir} />}
        {tab === 'settings' && (
          <div className="text-dawn/60 p-6 bg-nightmare/50 border border-smaragd/20 rounded-lg">
            <h2 className="font-display font-bold text-smaragd-light mb-3">Settings</h2>
            <p className="text-sm">WoW folder, patch directory, language, etc. — Phase B follow-up.</p>
          </div>
        )}
      </div>

      {/* Play button */}
      <button
        onClick={play}
        disabled={launching}
        className="mt-6 w-full py-4 bg-gradient-to-r from-smaragd to-smaragd-light text-dawn font-display font-bold text-xl rounded-lg shadow-2xl hover:shadow-smaragd/50 transition disabled:opacity-50"
      >
        {launching ? 'Launching…' : 'PLAY'}
      </button>

      {showRegister && <RegisterForm onClose={() => setShowRegister(false)} />}
    </div>
  );
}
