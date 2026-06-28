import { useState } from 'react';

export function MainScreen({ wowDir }: { wowDir: string }) {
  const [launching, setLaunching] = useState(false);

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
    <div className="h-full flex flex-col p-10">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-display font-bold text-smaragd-light">Wakingdream</h1>
          <p className="text-sm text-dawn/40 mt-1">{wowDir}</p>
        </div>
        <div className="text-right">
          <div className="text-xs text-dawn/60">Server Status</div>
          <div className="text-smaragd-light font-mono text-sm">● Online</div>
        </div>
      </div>

      {/* News placeholder */}
      <div className="flex-1 bg-nightmare/50 border border-smaragd/20 rounded-lg p-6 mb-6">
        <h2 className="text-lg font-display font-bold text-smaragd-light mb-3">Latest News</h2>
        <p className="text-dawn/70 text-sm">News feed will appear here. Placeholder for Phase B.</p>
      </div>

      {/* Play button */}
      <button
        onClick={play}
        disabled={launching}
        className="w-full py-4 bg-gradient-to-r from-smaragd to-smaragd-light text-dawn font-display font-bold text-xl rounded-lg shadow-2xl hover:shadow-smaragd/50 transition disabled:opacity-50"
      >
        {launching ? 'Launching…' : 'PLAY'}
      </button>
    </div>
  );
}
