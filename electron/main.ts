import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'node:path';
import fs from 'node:fs';
import { spawn } from 'node:child_process';
import { fetchManifest, syncPatches, SyncProgress } from './patch-sync';

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

ipcMain.handle('wow:launch', async (_e, wowDir: string) => {
  const wowExe = path.join(wowDir, 'Wow.exe');
  if (!fs.existsSync(wowExe)) throw new Error('Wow.exe not found');
  spawn(wowExe, [], { detached: true, stdio: 'ignore', cwd: wowDir }).unref();
  return { ok: true };
});

app.whenReady().then(createWindow);
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
