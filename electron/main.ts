import { app, BrowserWindow, ipcMain, dialog } from 'electron';
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

ipcMain.handle('patches:sync', async (_e, wowDir: string) => {
  const manifest = await fetchManifest(MANIFEST_URL);
  const installed = await syncPatches(wowDir, manifest, (p: SyncProgress) => {
    mainWindow?.webContents.send('patches:progress', p);
  });
  return { installed, manifest };
});

ipcMain.handle('wow:set-realmlist', async (_e, wowDir: string, realmHost: string) => {
  const realmlistPath = path.join(wowDir, 'realmlist.wtf');
  const content = `set realmlist ${realmHost}\n`;
  if (fs.existsSync(realmlistPath)) {
    fs.copyFileSync(realmlistPath, realmlistPath + '.bak');
  }
  fs.writeFileSync(realmlistPath, content, 'utf-8');
  return { ok: true };
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
ipcMain.handle(
  'wow:launch',
  async (_e, wowDir: string, launchSpec?: { kind?: string; gameSlug?: string; command?: string }) => {
    const wowExe = path.join(wowDir, 'Wow.exe');
    if (!fs.existsSync(wowExe)) throw new Error('Wow.exe not found');

    const kind =
      launchSpec?.kind
      || (process.platform === 'win32' ? 'native' : 'wine');

    const spawnDetached = (cmd: string, args: string[]) => {
      spawn(cmd, args, { detached: true, stdio: 'ignore', cwd: wowDir }).unref();
    };

    switch (kind) {
      case 'native': {
        spawnDetached(wowExe, []);
        return { ok: true, runtime: 'native' };
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
        spawnDetached('wine', [wowExe]);
        return { ok: true, runtime: 'wine' };
      }
      case 'lutris-exec': {
        if (!isAvailable('lutris')) throw new Error('Lutris not found. Install with: sudo apt install lutris');
        // lutris -e <executable> runs the binary using Lutris default Wine config
        spawnDetached('lutris', ['-e', wowExe]);
        return { ok: true, runtime: 'lutris-exec' };
      }
      case 'lutris-game': {
        if (!isAvailable('lutris')) throw new Error('Lutris not found. Install with: sudo apt install lutris');
        const slug = launchSpec?.gameSlug?.trim();
        if (!slug) throw new Error('Lutris game slug missing (e.g. "world-of-warcraft")');
        spawnDetached('lutris', [`lutris:rungame/${slug}`]);
        return { ok: true, runtime: `lutris-game:${slug}` };
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
        spawnDetached(cmd, args);
        return { ok: true, runtime: `custom:${cmd}` };
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
