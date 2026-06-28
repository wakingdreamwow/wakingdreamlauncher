import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('wakingdream', {
  getVersion: () => ipcRenderer.invoke('app:get-version'),
  minimize: () => ipcRenderer.invoke('app:minimize'),
  close: () => ipcRenderer.invoke('app:close'),
  pickWowDir: () => ipcRenderer.invoke('file:pick-wow-dir'),
  fetchManifest: () => ipcRenderer.invoke('fetch:manifest'),
  setRealmlist: (dir: string, host: string) => ipcRenderer.invoke('wow:set-realmlist', dir, host),
  launchWow: (dir: string) => ipcRenderer.invoke('wow:launch', dir),
});
