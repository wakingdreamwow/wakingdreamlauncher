import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron';
import path from 'node:path';
import fs from 'node:fs';
import { spawn, execFileSync } from 'node:child_process';
import pkg from 'electron-updater';
const { autoUpdater } = pkg;
import { fetchManifest, syncPatches, SyncProgress } from './patch-sync';
import {
  installMany,
  listInstalled,
  uninstall,
  AddonSpec,
  AddonInstallProgress,
} from './addon-install';

const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL;

const MANIFEST_URL = 'https://patches.wakingdream.cc/manifest.json';

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 720,
    minWidth: 900,
    minHeight: 600,
    frame: false,
    backgroundColor: '#0F1419',
    icon: path.join(__dirname, '..', 'assets', 'logo', 'icon-256.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  if (VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }
}

// ----- IPC handlers -----
ipcMain.handle('app:get-version', () => app.getVersion());
ipcMain.handle('app:minimize', () => BrowserWindow.getFocusedWindow()?.minimize());
ipcMain.handle('app:close', () => BrowserWindow.getFocusedWindow()?.close());

ipcMain.handle('file:pick-wow-dir', async () => {
  const r = await dialog.showOpenDialog({
    title: 'Select your WoW 3.3.5a folder',
    properties: ['openDirectory'],
  });
  if (r.canceled || r.filePaths.length === 0) return null;
  const dir = r.filePaths[0];
  const wowExe = path.join(dir, 'Wow.exe');
  return { dir, valid: fs.existsSync(wowExe) };
});

ipcMain.handle('fetch:manifest', async () => {
  return await fetchManifest(MANIFEST_URL);
});

// Guard against concurrent syncs (PatchSyncScreen + MainScreen auto-sync race).
// Without this, both invocations download to the same .partial file and the
// loser hits ENOENT on rename. With a single in-flight Promise, callers share
// the same result.
let _syncInFlight: Promise<{ installed: string[]; manifest: unknown }> | null = null;
ipcMain.handle('patches:sync', async (_e, wowDir: string) => {
  if (_syncInFlight) return _syncInFlight;
  _syncInFlight = (async () => {
    try {
      const manifest = await fetchManifest(MANIFEST_URL);
      const installed = await syncPatches(wowDir, manifest, (p: SyncProgress) => {
        mainWindow?.webContents.send('patches:progress', p);
      });
      return { installed, manifest };
    } finally {
      _syncInFlight = null;
    }
  })();
  return _syncInFlight;
});

// In WoW 3.3.5a, realmlist.wtf lives in two places:
//   1. <wowDir>/realmlist.wtf
//   2. <wowDir>/Data/<locale>/realmlist.wtf  ← TAKES PRECEDENCE if it exists
// Writing only the root file does nothing on installs that still have the
// Blizzard locale file. We write to root + every <locale>/realmlist.wtf
// we can find (Data subdirs that contain a base.MPQ are real locale dirs).
ipcMain.handle('wow:set-realmlist', async (_e, wowDir: string, realmHost: string) => {
  const content = `set realmlist ${realmHost}\n`;
  const written: string[] = [];

  const writeOne = (filePath: string) => {
    if (fs.existsSync(filePath)) {
      fs.copyFileSync(filePath, filePath + '.bak');
    } else {
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
    }
    fs.writeFileSync(filePath, content, 'utf-8');
    written.push(filePath);
  };

  // Root
  writeOne(path.join(wowDir, 'realmlist.wtf'));

  // Locale dirs
  const dataDir = path.join(wowDir, 'Data');
  if (fs.existsSync(dataDir)) {
    for (const entry of fs.readdirSync(dataDir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const localeDir = path.join(dataDir, entry.name);
      // A real locale dir contains base-<locale>.MPQ or locale-<locale>.MPQ
      const files = fs.readdirSync(localeDir);
      const isLocale = files.some((f) => /^(base|locale)-/i.test(f));
      if (isLocale) writeOne(path.join(localeDir, 'realmlist.wtf'));
    }
  }

  return { ok: true, written };
});

ipcMain.handle(
  'addons:install',
  async (_e, wowDir: string, specs: AddonSpec[]) => {
    return await installMany(wowDir, specs, (p: AddonInstallProgress) => {
      mainWindow?.webContents.send('addons:progress', p);
    });
  },
);

ipcMain.handle('addons:list-installed', async () => {
  return listInstalled();
});

ipcMain.handle(
  'addons:uninstall',
  async (_e, wowDir: string, id: string, installsTo: string) => {
    return uninstall(wowDir, id, installsTo);
  },
);

function isAvailable(binary: string): boolean {
  try {
    execFileSync(binary, ['--version'], { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

// Open URL in the user's default browser, with light protocol allow-listing
// so we never accidentally hand the renderer a file:// or javascript: target.
ipcMain.handle('shell:open-external', async (_e, url: string) => {
  try {
    const u = new URL(url);
    if (!['https:', 'http:'].includes(u.protocol)) {
      throw new Error(`refusing non-http(s) URL: ${u.protocol}`);
    }
    await shell.openExternal(u.toString());
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
});

ipcMain.handle('system:detect-launchers', async () => {
  if (process.platform === 'win32') {
    return { platform: 'win32', wine: false, lutris: false, gamemoderun: false };
  }
  return {
    platform: process.platform,
    wine:        isAvailable('wine'),
    lutris:      isAvailable('lutris'),
    gamemoderun: isAvailable('gamemoderun'),
  };
});

// launchSpec.kind: 'native' | 'wine' | 'lutris-exec' | 'lutris-game' | 'custom'
// For 'lutris-game' → launchSpec.gameSlug (e.g. "world-of-warcraft")
// For 'custom'      → launchSpec.command (template; {wowExe} and {wowDir} placeholders)
//
// We pipe stderr/stdout for ~4 s after spawn so early failures (wrong path,
// missing runner, bad lutris slug) surface in the renderer error box. After
// the grace window the process is unref'd and detached.
ipcMain.handle(
  'wow:launch',
  async (_e, wowDir: string, launchSpec?: { kind?: string; gameSlug?: string; command?: string }) => {
    const wowExe = path.join(wowDir, 'Wow.exe');
    if (!fs.existsSync(wowExe)) throw new Error('Wow.exe not found');

    const kind =
      launchSpec?.kind
      || (process.platform === 'win32' ? 'native' : 'wine');

    const launchAndWatch = async (cmd: string, args: string[], runtime: string) => {
      console.log('[launch]', cmd, args);
      const proc = spawn(cmd, args, { detached: true, stdio: ['ignore', 'pipe', 'pipe'], cwd: wowDir });
      let stderr = '';
      let stdout = '';
      proc.stdout?.on('data', (d: Buffer) => { stdout += d.toString(); });
      proc.stderr?.on('data', (d: Buffer) => { stderr += d.toString(); });

      const earlyExit = await new Promise<{ code: number | null; signal: string | null } | null>((resolve) => {
        const t = setTimeout(() => resolve(null), 4000);
        proc.once('exit', (code, signal) => { clearTimeout(t); resolve({ code, signal }); });
        proc.once('error', () => { clearTimeout(t); resolve({ code: -1, signal: 'spawn-error' }); });
      });

      if (earlyExit) {
        const tail = (stderr || stdout).trim().split('\n').slice(-8).join('\n');
        if (earlyExit.code !== 0) {
          throw new Error(
            `${runtime} exited (code=${earlyExit.code}, signal=${earlyExit.signal}).\n\n` +
            `Command: ${cmd} ${args.join(' ')}\n\n` +
            (tail ? `Output (last 8 lines):\n${tail}` : '(no output captured)'),
          );
        }
        // exited 0 within 4s — probably a launcher that forks then quits (lutris does this)
      }

      proc.unref();
      return { ok: true, runtime };
    };

    switch (kind) {
      case 'native': {
        return await launchAndWatch(wowExe, [], 'native');
      }
      case 'wine': {
        if (!isAvailable('wine')) {
          throw new Error(
            'Wine not found. Install it first:\n' +
            '  Linux Mint / Ubuntu:  sudo apt install --install-recommends wine\n' +
            '  Fedora:               sudo dnf install wine\n' +
            '  macOS (Homebrew):     brew install --cask wine-stable',
          );
        }
        return await launchAndWatch('wine', [wowExe], 'wine');
      }
      case 'lutris-exec': {
        if (!isAvailable('lutris')) throw new Error('Lutris not found. Install with: sudo apt install lutris');
        // -e/--exec runs the program in Lutris's runtime; Lutris picks the runner
        // from the file type (Win32 .exe → wine). The --runner flag is not
        // supported on all Lutris versions and breaks 0.5.x style CLIs.
        return await launchAndWatch('lutris', ['-e', wowExe], 'lutris-exec');
      }
      case 'lutris-game': {
        if (!isAvailable('lutris')) throw new Error('Lutris not found. Install with: sudo apt install lutris');
        const slug = launchSpec?.gameSlug?.trim();
        if (!slug) throw new Error('Lutris game slug missing (e.g. "world-of-warcraft")');
        // lutris: URLs require either a numeric ID (rungameid) or slug (rungame).
        // We accept both — caller can paste either.
        const uri = /^\d+$/.test(slug) ? `lutris:rungameid/${slug}` : `lutris:rungame/${slug}`;
        return await launchAndWatch('lutris', [uri], `lutris-game:${slug}`);
      }
      case 'custom': {
        const template = launchSpec?.command?.trim();
        if (!template) throw new Error('Custom command empty');
        const rendered = template
          .replace(/\{wowExe\}/g, wowExe)
          .replace(/\{wowDir\}/g, wowDir);
        const tokens = rendered.match(/(?:[^\s"]+|"[^"]*")+/g) || [];
        const [cmd, ...args] = tokens.map((t) => t.replace(/^"|"$/g, ''));
        if (!cmd) throw new Error('Custom command parse error');
        return await launchAndWatch(cmd, args, `custom:${cmd}`);
      }
      default:
        throw new Error(`Unknown launch kind: ${kind}`);
    }
  },
);

// ----- Auto-update -----
// Loads metadata + AppImage from https://patches.wakingdream.cc/launcher/latest-linux.yml
// (or platform equivalent). Downloads in background, prompts user to restart.
autoUpdater.autoDownload = true;
autoUpdater.autoInstallOnAppQuit = true;

function pushUpdateEvent(payload: Record<string, unknown>): void {
  mainWindow?.webContents.send('updater:event', payload);
}

autoUpdater.on('checking-for-update', () =>
  pushUpdateEvent({ phase: 'checking' }),
);
autoUpdater.on('update-not-available', (info) =>
  pushUpdateEvent({ phase: 'none', currentVersion: app.getVersion(), latestVersion: info.version }),
);
autoUpdater.on('update-available', (info) =>
  pushUpdateEvent({ phase: 'available', version: info.version, releaseDate: info.releaseDate }),
);
autoUpdater.on('download-progress', (p) =>
  pushUpdateEvent({ phase: 'downloading', percent: p.percent, transferred: p.transferred, total: p.total, bps: p.bytesPerSecond }),
);
autoUpdater.on('update-downloaded', (info) =>
  pushUpdateEvent({ phase: 'ready', version: info.version }),
);
autoUpdater.on('error', (e) =>
  pushUpdateEvent({ phase: 'error', error: String(e?.message ?? e) }),
);

ipcMain.handle('updater:check', () => autoUpdater.checkForUpdates());
ipcMain.handle('updater:quit-and-install', () => autoUpdater.quitAndInstall());

app.whenReady().then(() => {
  createWindow();
  // Don't auto-check in dev (file:// URLs make electron-updater unhappy)
  if (!VITE_DEV_SERVER_URL) {
    // Give the renderer ~3 s to mount before kicking off the check so it can show progress
    setTimeout(() => {
      autoUpdater.checkForUpdates().catch((e) => pushUpdateEvent({ phase: 'error', error: String(e?.message ?? e) }));
    }, 3000);
  }
});
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
