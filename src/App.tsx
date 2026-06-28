import { useEffect, useState } from 'react';
import { TitleBar } from './components/TitleBar';
import { WelcomeScreen } from './pages/WelcomeScreen';
import { ClientDetectScreen } from './pages/ClientDetectScreen';
import { PatchSyncScreen } from './pages/PatchSyncScreen';
import { MainScreen } from './pages/MainScreen';

type Step = 'welcome' | 'client' | 'patches' | 'main';

export function App() {
  const [step, setStep] = useState<Step>('welcome');
  const [wowDir, setWowDir] = useState<string | null>(null);

  // Load saved wowDir on startup
  useEffect(() => {
    const saved = localStorage.getItem('wakingdream:wowDir');
    if (saved) {
      setWowDir(saved);
      setStep('main');
    }
  }, []);

  const onClientFound = (dir: string) => {
    setWowDir(dir);
    localStorage.setItem('wakingdream:wowDir', dir);
    setStep('patches');
  };

  return (
    <div className="h-screen flex flex-col bg-nightmare">
      <TitleBar />
      <div className="flex-1 overflow-y-auto">
        {step === 'welcome' && <WelcomeScreen onContinue={() => setStep('client')} />}
        {step === 'client' && <ClientDetectScreen onFound={onClientFound} />}
        {step === 'patches' && <PatchSyncScreen onDone={() => setStep('main')} wowDir={wowDir!} />}
        {step === 'main' && <MainScreen wowDir={wowDir!} />}
      </div>
    </div>
  );
}
