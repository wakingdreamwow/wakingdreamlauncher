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
  // Where the file should land inside the WoW dir.
  // Default 'Data' (= <wowDir>/Data/<name>) for backward compat, but locale
  // MPQs MUST set this to 'Data/enUS' (etc.) — WoW only reads locale patches
  // from <wowDir>/Data/<locale>/.
  install_dir?: string;
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
): Promise<{ sha256: string; bytes: number }> {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha256');
    const file = fs.createWriteStream(destPath);
    const start = Date.now();
    let done = 0;
    let settled = false;
    const settle = (fn: () => void) => { if (!settled) { settled = true; fn(); } };

    file.on('error', (err) => settle(() => reject(new Error(`write failed: ${err.message}`))));

    const followRedirect = (u: string, redirectsLeft: number) => {
      const req = https.get(u, (res) => {
        if (
          (res.statusCode === 301 || res.statusCode === 302 || res.statusCode === 307 || res.statusCode === 308) &&
          res.headers.location && redirectsLeft > 0
        ) {
          res.resume();
          followRedirect(new URL(res.headers.location, u).toString(), redirectsLeft - 1);
          return;
        }
        if (res.statusCode !== 200) {
          settle(() => reject(new Error(`HTTP ${res.statusCode} ${res.statusMessage} for ${u}`)));
          res.resume();
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
            // Verify the file actually landed on disk with the bytes we counted.
            // (Defensive: catches silent fs-quota / permission edge cases.)
            try {
              const stat = fs.statSync(destPath);
              if (stat.size !== done) {
                return settle(() => reject(new Error(
                  `download truncated: wrote ${stat.size} bytes, expected ${done}`,
                )));
              }
              settle(() => resolve({ sha256: hash.digest('hex'), bytes: done }));
            } catch (e) {
              settle(() => reject(new Error(
                `download finished but file missing: ${(e as Error).message}`,
              )));
            }
          });
        });

        res.on('error', (err) => settle(() => reject(err)));
      });
      req.setTimeout(timeoutMs, () => req.destroy(new Error('Request timeout')));
      req.on('error', (err) => settle(() => reject(err)));
    };

    followRedirect(url, 5);
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

  const destFileFor = (p: PatchEntry) =>
    path.join(wowDir, p.install_dir || 'Data', p.name);

  // A patch needs (re-)installing if:
  //  - we never installed it, OR
  //  - its sha256 changed, OR
  //  - the file is missing at the expected install_dir (e.g. install_dir
  //    moved between versions — backwards-compat for older buggy installs
  //    that wrote locale patches to Data/ instead of Data/enUS/).
  const toDownload: PatchEntry[] = manifest.patches.filter((p) => {
    const known = local.patches[p.name];
    if (!known || known.sha256 !== p.sha256) return true;
    if (!fs.existsSync(destFileFor(p))) return true;
    return false;
  });

  // Clean up old wrong-location copies (e.g. pre-install_dir versions put
  // locale MPQs in <wowDir>/Data/<name>. We delete them if the new
  // install_dir is a subdirectory of Data).
  for (const p of manifest.patches) {
    const wrongOld = path.join(wowDir, 'Data', p.name);
    const correctNew = destFileFor(p);
    if (wrongOld !== correctNew && fs.existsSync(wrongOld)) {
      try {
        fs.unlinkSync(wrongOld);
        onProgress({ phase: 'check', message: `Removed stale ${p.name} from Data/ (moved to ${p.install_dir})` });
      } catch { /* ignore */ }
    }
  }

  if (toDownload.length === 0) {
    onProgress({ phase: 'done', message: 'All patches up to date.' });
    return [];
  }

  for (let i = 0; i < toDownload.length; i++) {
    const patch = toDownload[i];
    const destFile = destFileFor(patch);
    fs.mkdirSync(path.dirname(destFile), { recursive: true });
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
      try { fs.unlinkSync(tmpFile); } catch { /* ignore */ }
      throw new Error(`Hash mismatch for ${patch.name}: expected ${patch.sha256} got ${result.sha256}`);
    }

    onProgress({
      phase: 'installing',
      current_patch: patch.name,
      message: `Installing ${patch.name}…`,
    });

    // Guard against the file disappearing between download and rename
    // (race with a parallel sync, antivirus quarantine, etc.).
    if (!fs.existsSync(tmpFile)) {
      throw new Error(`partial file vanished before install: ${tmpFile} (concurrent sync?)`);
    }
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
