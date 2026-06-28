import { useState } from 'react';

export function ClientDetectScreen({ onFound }: { onFound: (dir: string) => void }) {
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);

  const pick = async () => {
    setError(null);
    setScanning(true);
    try {
      const result = await window.wakingdream.pickWowDir();
      if (!result) {
        setScanning(false);
        return;
      }
      if (!result.valid) {
        setError("Wow.exe not found in this folder. Make sure you're picking the WoW 3.3.5a installation root.");
        setScanning(false);
        return;
      }
      onFound(result.dir);
    } catch (e) {
      setError(String(e));
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="h-full flex flex-col items-center justify-center p-10 text-center">
      <h2 className="text-2xl font-display font-bold mb-2">Locate Your WoW 3.3.5a Client</h2>
      <p className="text-dawn/70 mb-6 max-w-md">
        Pick the folder that contains <code className="text-smaragd-light">Wow.exe</code>. We never copy, redistribute or share Blizzard's files — your installation stays local.
      </p>

      {error && (
        <div className="mb-4 px-4 py-2 bg-red-900/50 border border-red-700 rounded text-sm text-red-200">{error}</div>
      )}

      <button
        onClick={pick}
        disabled={scanning}
        className="px-8 py-3 bg-smaragd hover:bg-smaragd-light text-dawn font-semibold rounded-lg shadow-lg transition disabled:opacity-50"
      >
        {scanning ? 'Selecting…' : 'Browse for WoW folder'}
      </button>

      <div className="mt-8 text-xs text-dawn/40 max-w-md">
        Don't have the 3.3.5a client? You'll need to source it yourself — try searching for "WoW 3.3.5a client" or use a backup copy of your original WotLK media.
      </div>
    </div>
  );
}
