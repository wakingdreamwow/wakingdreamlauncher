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

export interface WakingdreamAPI {
  getVersion: () => Promise<string>;
  minimize: () => Promise<void>;
  close: () => Promise<void>;
  pickWowDir: () => Promise<{ dir: string; valid: boolean } | null>;
  fetchManifest: () => Promise<Manifest>;
  syncPatches: (wowDir: string) => Promise<SyncResult>;
  setRealmlist: (dir: string, host: string) => Promise<{ ok: boolean }>;
  launchWow: (dir: string) => Promise<{ ok: boolean }>;
  onPatchProgress: (cb: (p: SyncProgress) => void) => () => void;
}

declare global {
  interface Window {
    wakingdream: WakingdreamAPI;
  }
}
