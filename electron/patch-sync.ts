import { app } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';
import crypto from 'node:crypto';

export interface PatchEntry {
  name: string;
  sha256: string;
  size_bytes: number;
  url: string;
  category?: string;
  description?: string;
}

export interface Manifest {
  version: string;
  generated_at: string;
  min_client_build: number;
  realm_address: string;
  realm_port: number;
  patches: PatchEntry[];
  patch_notes_url?: string;
}

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

const STATE_FILE = 'wakingdream-state.json';

interface LocalState {
  patches: { [name: string]: { sha256: string; installed_at: string } };
}

function loadLocalState(stateDir: string): LocalState {
  const p = path.join(stateDir, STATE_FILE);
  try {
    return JSON.parse(fs.readFileSync(p, 'utf-8'));
  } catch {
    return { patches: {} };
  }
}

function saveLocalState(stateDir: string, state: LocalState) {
  const p = path.join(stateDir, STATE_FILE);
  fs.writeFileSync(p, JSON.stringify(state, null, 2), 'utf-8');
}

function httpsDownload(
  url: string,
  destPath: string,
  onProgress: (done: number, total: number, bps: number) => void,
  timeoutMs = 600000
): Promise<{ sha256: string }> {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const file = fs.createWriteStream(destPath);
    const start = Date.now();
    let done = 0;

    const req = https.get(url, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode} ${res.statusMessage}`));
        return;
      }
      const total = parseInt(res.headers['content-length'] || '0', 10);

      res.on('data', (chunk: Buffer) => {
        hash.update(chunk);
        file.write(chunk);
        done += chunk.length;
        const elapsed = (Date.now() - start) / 1000;
        const bps = elapsed > 0 ? done / elapsed : 0;
        onProgress(done, total, bps);
      });

      res.on('end', () => {
        file.end(() => {
          resolve({ sha256: hash.digest('hex') });
        });
      });

      res.on('error', reject);
    });
    req.setTimeout(timeoutMs, () => req.destroy(new Error('Request timeout')));
    req.on('error', reject);
  });
}

export async function fetchManifest(url: string): Promise<Manifest> {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        let data = '';
        res.on('data', (c) => (data += c));
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(e);
          }
        });
      })
      .on('error', reject);
  });
}

/**
 * Sync local patches with manifest.
 * Returns names of patches that were freshly installed.
 */
export async function syncPatches(
  wowDir: string,
  manifest: Manifest,
  onProgress: (p: SyncProgress) => void
): Promise<string[]> {
  const stateDir = path.join(wowDir, 'Data', 'wakingdream');
  if (!fs.existsSync(stateDir)) fs.mkdirSync(stateDir, { recursive: true });

  const local = loadLocalState(stateDir);
  const installed: string[] = [];

  onProgress({ phase: 'check', message: 'Comparing local patches with manifest…' });

  // Identify patches that need download
  const toDownload: PatchEntry[] = manifest.patches.filter((p) => {
    const known = local.patches[p.name];
    return !known || known.sha256 !== p.sha256;
  });

  if (toDownload.length === 0) {
    onProgress({ phase: 'done', message: 'All patches up to date.' });
    return [];
  }

  for (let i = 0; i < toDownload.length; i++) {
    const patch = toDownload[i];
    const destFile = path.join(wowDir, 'Data', patch.name);
    const tmpFile = destFile + '.partial';

    onProgress({
      phase: 'downloading',
      current_patch: patch.name,
      current_index: i + 1,
      total_patches: toDownload.length,
      bytes_done: 0,
      bytes_total: patch.size_bytes,
      speed_bps: 0,
      message: `Downloading ${patch.name}…`,
    });

    const result = await httpsDownload(patch.url, tmpFile, (done, total, bps) => {
      onProgress({
        phase: 'downloading',
        current_patch: patch.name,
        current_index: i + 1,
        total_patches: toDownload.length,
        bytes_done: done,
        bytes_total: total,
        speed_bps: bps,
      });
    });

    onProgress({
      phase: 'verifying',
      current_patch: patch.name,
      message: `Verifying ${patch.name} (sha256)…`,
    });

    if (result.sha256 !== patch.sha256) {
      fs.unlinkSync(tmpFile);
      throw new Error(`Hash mismatch for ${patch.name}: expected ${patch.sha256} got ${result.sha256}`);
    }

    onProgress({
      phase: 'installing',
      current_patch: patch.name,
      message: `Installing ${patch.name}…`,
    });

    fs.renameSync(tmpFile, destFile);
    local.patches[patch.name] = { sha256: patch.sha256, installed_at: new Date().toISOString() };
    saveLocalState(stateDir, local);
    installed.push(patch.name);
  }

  onProgress({
    phase: 'done',
    message: `${installed.length} patch(es) installed.`,
  });

  return installed;
}
