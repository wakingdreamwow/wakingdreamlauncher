import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import path from 'node:path';
import fs from 'node:fs';
import https from 'node:https';
import { spawn } from 'node:child_process';
import crypto from 'node:crypto';

const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL;

function createWindow() {
  const win = new BrowserWindow({
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
    win.loadURL(VITE_DEV_SERVER_URL);
    win.webContents.openDevTools({ mode: 'detach' });
  } else {
    win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
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
  const exists = fs.existsSync(wowExe);
  return { dir, valid: exists };
});

ipcMain.handle('fetch:manifest', async () => {
  return new Promise((resolve, reject) => {
    https
      .get('https://patches.wakingdream.cc/manifest.json', (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
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
});

ipcMain.handle('wow:set-realmlist', async (_e, wowDir: string, realmHost: string) => {
  const realmlistPath = path.join(wowDir, 'realmlist.wtf');
  const content = `set realmlist ${realmHost}\n`;
  // Backup existing
  if (fs.existsSync(realmlistPath)) {
    fs.copyFileSync(realmlistPath, realmlistPath + '.bak');
  }
  fs.writeFileSync(realmlistPath, content, 'utf-8');
  return { ok: true };
});

ipcMain.handle('wow:launch', async (_e, wowDir: string) => {
  const wowExe = path.join(wowDir, 'Wow.exe');
  if (!fs.existsSync(wowExe)) {
    throw new Error('Wow.exe not found');
  }
  spawn(wowExe, [], { detached: true, stdio: 'ignore', cwd: wowDir }).unref();
  return { ok: true };
});

app.whenReady().then(createWindow);
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
