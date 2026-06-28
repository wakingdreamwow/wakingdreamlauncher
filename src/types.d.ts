export interface WakingdreamAPI {
  getVersion: () => Promise<string>;
  minimize: () => Promise<void>;
  close: () => Promise<void>;
  pickWowDir: () => Promise<{ dir: string; valid: boolean } | null>;
  fetchManifest: () => Promise<any>;
  setRealmlist: (dir: string, host: string) => Promise<{ ok: boolean }>;
  launchWow: (dir: string) => Promise<{ ok: boolean }>;
}
declare global {
  interface Window { wakingdream: WakingdreamAPI }
}
