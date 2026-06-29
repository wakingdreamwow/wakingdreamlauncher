export interface SyncProgress {
  phase: 'manifest' | 'check' | 'downloading' | 'verifying' | 'installing' | 'done';
  current_patch?: string;
  current_index?: number;
  total_patches?: number;
  bytes_done?: number;
  bytes_total?: number;
  speed_bps?: number;
  message?: string;
}

export interface Manifest {
  version: string;
  generated_at: string;
  min_client_build: number;
  realm_address: string;
  realm_port: number;
  patches: any[];
  patch_notes_url?: string;
}

export interface SyncResult {
  installed: string[];
  manifest: Manifest;
}

export interface AddonSpec {
  id: string;
  name: string;
  zip_url: string;
  installs_to: string;
}

export interface AddonInstallProgress {
  id: string;
  name: string;
  phase: 'downloading' | 'extracting' | 'done' | 'error';
  bytes_done?: number;
  bytes_total?: number;
  error?: string;
}

export interface AddonInstallResult {
  id: string;
  folders: string[];
  error?: string;
}

export interface InstalledAddon {
  name: string;
  installs_to: string;
  installed_at: string;
}

export interface WakingdreamAPI {
  getVersion: () => Promise<string>;
  minimize: () => Promise<void>;
  close: () => Promise<void>;
  pickWowDir: () => Promise<{ dir: string; valid: boolean } | null>;
  fetchManifest: () => Promise<Manifest>;
  syncPatches: (wowDir: string) => Promise<SyncResult>;
  setRealmlist: (dir: string, host: string) => Promise<{ ok: boolean }>;
  onPatchProgress: (cb: (p: SyncProgress) => void) => () => void;

  installAddons: (wowDir: string, specs: AddonSpec[]) => Promise<AddonInstallResult[]>;
  listInstalledAddons: () => Promise<Record<string, InstalledAddon>>;
  uninstallAddon: (wowDir: string, id: string, installsTo: string) => Promise<{ removed: string[] }>;
  onAddonProgress: (cb: (p: AddonInstallProgress) => void) => () => void;

  launchWow: (
    dir: string,
    launchSpec?: LaunchSpec,
  ) => Promise<{ ok: boolean; runtime?: string }>;
  detectLaunchers: () => Promise<LauncherDetection>;

  checkForUpdates: () => Promise<unknown>;
  quitAndInstallUpdate: () => Promise<unknown>;
  onUpdaterEvent: (cb: (e: UpdaterEvent) => void) => () => void;
}

export type UpdaterPhase = 'checking' | 'none' | 'available' | 'downloading' | 'ready' | 'error';

export interface UpdaterEvent {
  phase: UpdaterPhase;
  // For phase=available / downloading / ready:
  version?: string;
  // For phase=downloading:
  percent?: number;
  transferred?: number;
  total?: number;
  bps?: number;
  // For phase=none:
  currentVersion?: string;
  latestVersion?: string;
  // For phase=error:
  error?: string;
  releaseDate?: string;
}

export type LaunchKind = 'native' | 'wine' | 'lutris-exec' | 'lutris-game' | 'custom';

export interface LaunchSpec {
  kind: LaunchKind;
  gameSlug?: string;   // for kind === 'lutris-game'
  command?: string;    // for kind === 'custom'; supports {wowExe} and {wowDir} placeholders
}

export interface LauncherDetection {
  platform: NodeJS.Platform;
  wine: boolean;
  lutris: boolean;
  gamemoderun: boolean;
}

declare global {
  interface Window {
    wakingdream: WakingdreamAPI;
  }
}

// Vite asset imports — image files resolve to a URL string at build time.
declare module '*.png' {
  const url: string;
  export default url;
}
declare module '*.jpg' {
  const url: string;
  export default url;
}
declare module '*.svg' {
  const url: string;
  export default url;
}
