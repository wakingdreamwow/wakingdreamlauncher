import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

contextBridge.exposeInMainWorld('wakingdream', {
  getVersion: () => ipcRenderer.invoke('app:get-version'),
  minimize: () => ipcRenderer.invoke('app:minimize'),
  close: () => ipcRenderer.invoke('app:close'),
  pickWowDir: () => ipcRenderer.invoke('file:pick-wow-dir'),
  fetchManifest: () => ipcRenderer.invoke('fetch:manifest'),
  syncPatches: (wowDir: string) => ipcRenderer.invoke('patches:sync', wowDir),
  setRealmlist: (dir: string, host: string) => ipcRenderer.invoke('wow:set-realmlist', dir, host),
  launchWow: (dir: string) => ipcRenderer.invoke('wow:launch', dir),
  onPatchProgress: (cb: (p: any) => void) => {
    const listener = (_e: IpcRendererEvent, p: any) => cb(p);
    ipcRenderer.on('patches:progress', listener);
    return () => ipcRenderer.removeListener('patches:progress', listener);
  },
});
