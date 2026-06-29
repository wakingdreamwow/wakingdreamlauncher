import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

contextBridge.exposeInMainWorld('wakingdream', {
  getVersion: () => ipcRenderer.invoke('app:get-version'),
  minimize: () => ipcRenderer.invoke('app:minimize'),
  close: () => ipcRenderer.invoke('app:close'),
  pickWowDir: () => ipcRenderer.invoke('file:pick-wow-dir'),
  fetchManifest: () => ipcRenderer.invoke('fetch:manifest'),
  syncPatches: (wowDir: string) => ipcRenderer.invoke('patches:sync', wowDir),
  setRealmlist: (dir: string, host: string) => ipcRenderer.invoke('wow:set-realmlist', dir, host),
  launchWow: (dir: string, launchSpec?: any) => ipcRenderer.invoke('wow:launch', dir, launchSpec),
  detectLaunchers: () => ipcRenderer.invoke('system:detect-launchers'),

  openExternal: (url: string) => ipcRenderer.invoke('shell:open-external', url),

  checkForUpdates: () => ipcRenderer.invoke('updater:check'),
  quitAndInstallUpdate: () => ipcRenderer.invoke('updater:quit-and-install'),
  onUpdaterEvent: (cb: (e: any) => void) => {
    const listener = (_e: IpcRendererEvent, payload: any) => cb(payload);
    ipcRenderer.on('updater:event', listener);
    return () => ipcRenderer.removeListener('updater:event', listener);
  },
  onPatchProgress: (cb: (p: any) => void) => {
    const listener = (_e: IpcRendererEvent, p: any) => cb(p);
    ipcRenderer.on('patches:progress', listener);
    return () => ipcRenderer.removeListener('patches:progress', listener);
  },

  // Addon manager
  installAddons: (wowDir: string, specs: any[]) =>
    ipcRenderer.invoke('addons:install', wowDir, specs),
  listInstalledAddons: () => ipcRenderer.invoke('addons:list-installed'),
  uninstallAddon: (wowDir: string, id: string, installsTo: string) =>
    ipcRenderer.invoke('addons:uninstall', wowDir, id, installsTo),
  onAddonProgress: (cb: (p: any) => void) => {
    const listener = (_e: IpcRendererEvent, p: any) => cb(p);
    ipcRenderer.on('addons:progress', listener);
    return () => ipcRenderer.removeListener('addons:progress', listener);
  },
});
