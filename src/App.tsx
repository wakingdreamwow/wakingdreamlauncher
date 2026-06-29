import { useEffect, useState } from 'react';
import { TitleBar } from './components/TitleBar';
import { UpdateBanner } from './components/UpdateBanner';
import { VersionFooter } from './components/VersionFooter';
import { WelcomeScreen } from './pages/WelcomeScreen';
import { ClientDetectScreen } from './pages/ClientDetectScreen';
import { LaunchMethodScreen, loadSavedLaunchSpec } from './pages/LaunchMethodScreen';
import { PatchSyncScreen } from './pages/PatchSyncScreen';
import { MainScreen } from './pages/MainScreen';
import type { LaunchSpec } from './types';

type Step = 'welcome' | 'client' | 'launch-method' | 'patches' | 'main';

export function App() {
  const [step, setStep] = useState<Step>('welcome');
  const [wowDir, setWowDir] = useState<string | null>(null);
  const [launchSpec, setLaunchSpec] = useState<LaunchSpec | null>(null);

  useEffect(() => {
    const savedDir  = localStorage.getItem('wakingdream:wowDir');
    const savedSpec = loadSavedLaunchSpec();
    if (savedDir && savedSpec) {
      setWowDir(savedDir);
      setLaunchSpec(savedSpec);
      setStep('main');
    } else if (savedDir) {
      setWowDir(savedDir);
      setStep('launch-method');
    }
  }, []);

  const onClientFound = (dir: string) => {
    setWowDir(dir);
    localStorage.setItem('wakingdream:wowDir', dir);
    setStep('launch-method');
  };

  const onLaunchMethodChosen = (spec: LaunchSpec) => {
    setLaunchSpec(spec);
    setStep('patches');
  };

  return (
    <div className="h-screen flex flex-col bg-nightmare">
      <TitleBar />
      <UpdateBanner />
      <div className="flex-1 min-h-0 overflow-y-auto">
        {step === 'welcome'       && <WelcomeScreen      onContinue={() => setStep('client')} />}
        {step === 'client'        && <ClientDetectScreen onFound={onClientFound} />}
        {step === 'launch-method' && <LaunchMethodScreen onContinue={onLaunchMethodChosen} />}
        {step === 'patches'       && <PatchSyncScreen    onDone={() => setStep('main')} wowDir={wowDir!} />}
        {step === 'main'          && <MainScreen wowDir={wowDir!} launchSpec={launchSpec!} onSpecChange={setLaunchSpec} />}
      </div>
      <VersionFooter />
    </div>
  );
}
