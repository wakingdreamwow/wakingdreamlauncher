import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import https from 'node:https';
import { app } from 'electron';
import extract from 'extract-zip';

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

const STATE_FILE = 'wakingdream-addons.json';

interface AddonState {
  installed: { [id: string]: { name: string; installs_to: string; installed_at: string } };
}

function stateDir(): string {
  return app.getPath('userData');
}

function loadState(): AddonState {
  const p = path.join(stateDir(), STATE_FILE);
  try {
    return JSON.parse(fs.readFileSync(p, 'utf-8'));
  } catch {
    return { installed: {} };
  }
}

function saveState(s: AddonState): void {
  fs.mkdirSync(stateDir(), { recursive: true });
  fs.writeFileSync(path.join(stateDir(), STATE_FILE), JSON.stringify(s, null, 2));
}

function downloadToFile(
  url: string,
  destPath: string,
  onChunk?: (bytesDone: number, bytesTotal: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const doRequest = (u: string, redirectsLeft: number) => {
      https
        .get(u, (res) => {
          if (
            (res.statusCode === 301 || res.statusCode === 302 || res.statusCode === 307 || res.statusCode === 308) &&
            res.headers.location &&
            redirectsLeft > 0
          ) {
            res.resume();
            const next = new URL(res.headers.location, u).toString();
            doRequest(next, redirectsLeft - 1);
            return;
          }
          if (res.statusCode !== 200) {
            reject(new Error(`HTTP ${res.statusCode} for ${u}`));
            res.resume();
            return;
          }
          const total = parseInt(res.headers['content-length'] ?? '0', 10);
          let done = 0;
          const out = fs.createWriteStream(destPath);
          res.on('data', (chunk: Buffer) => {
            done += chunk.length;
            onChunk?.(done, total);
          });
          res.pipe(out);
          out.on('finish', () => out.close(() => resolve()));
          out.on('error', reject);
          res.on('error', reject);
        })
        .on('error', reject);
    };
    doRequest(url, 5);
  });
}

/**
 * Download a zip and extract it into <wowDir>/Interface/AddOns/.
 * Returns the set of top-level folder names installed (so callers can later
 * uninstall by removing exactly those).
 */
export async function installOne(
  wowDir: string,
  spec: AddonSpec,
  onProgress?: (p: AddonInstallProgress) => void,
): Promise<{ id: string; folders: string[] }> {
  const addonsDir = path.join(wowDir, 'Interface', 'AddOns');
  fs.mkdirSync(addonsDir, { recursive: true });

  const tmpZip = path.join(os.tmpdir(), `wakingdream-${spec.id}-${Date.now()}.zip`);

  try {
    onProgress?.({ id: spec.id, name: spec.name, phase: 'downloading', bytes_done: 0, bytes_total: 0 });
    await downloadToFile(spec.zip_url, tmpZip, (done, total) =>
      onProgress?.({ id: spec.id, name: spec.name, phase: 'downloading', bytes_done: done, bytes_total: total }),
    );

    onProgress?.({ id: spec.id, name: spec.name, phase: 'extracting' });
    const folders = new Set<string>();
    await extract(tmpZip, {
      dir: addonsDir,
      onEntry: (entry) => {
        const top = entry.fileName.split(/[\\/]/, 1)[0];
        if (top) folders.add(top);
      },
    });

    const state = loadState();
    state.installed[spec.id] = {
      name: spec.name,
      installs_to: spec.installs_to,
      installed_at: new Date().toISOString(),
    };
    saveState(state);

    onProgress?.({ id: spec.id, name: spec.name, phase: 'done' });
    return { id: spec.id, folders: Array.from(folders) };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    onProgress?.({ id: spec.id, name: spec.name, phase: 'error', error: msg });
    throw err;
  } finally {
    try { fs.unlinkSync(tmpZip); } catch { /* ignore */ }
  }
}

export async function installMany(
  wowDir: string,
  specs: AddonSpec[],
  onProgress?: (p: AddonInstallProgress) => void,
): Promise<{ id: string; folders: string[]; error?: string }[]> {
  const results: { id: string; folders: string[]; error?: string }[] = [];
  for (const spec of specs) {
    try {
      const r = await installOne(wowDir, spec, onProgress);
      results.push(r);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      results.push({ id: spec.id, folders: [], error: msg });
    }
  }
  return results;
}

export function listInstalled(): AddonState['installed'] {
  return loadState().installed;
}

export function uninstall(wowDir: string, id: string, installsTo: string): { removed: string[] } {
  const addonsDir = path.join(wowDir, 'Interface', 'AddOns');
  const removed: string[] = [];
  // Conservatively remove only the documented folder name (installs_to).
  const target = path.join(addonsDir, installsTo);
  if (fs.existsSync(target) && fs.statSync(target).isDirectory()) {
    fs.rmSync(target, { recursive: true, force: true });
    removed.push(installsTo);
  }
  const state = loadState();
  delete state.installed[id];
  saveState(state);
  return { removed };
}
