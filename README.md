# Wakingdream Launcher

Cross-platform launcher for the **Wakingdream** WoW 3.3.5a private server.

Built with Electron 28 + React 18 + Vite 5 + Tailwind 3.

## Features

- Onboarding flow: detect existing WoW 3.3.5a client, pick launch wrapper (Wine / Lutris / custom), one-time setup
- Patch sync: pulls realm-side MPQ patches from `https://patches.wakingdream.cc/manifest.json`, installs into `Data/<locale>/`, hashes verified
- News feed: live from FCMS backend (`/api/launcher/news`)
- Server status: realm online state + active world bosses, polled every 30s
- Account registration: stub (SRP6 wrapper TBD; falls back to the web register page)
- Addon manager: curated list (DBM, Recount, AtlasLoot, Bartender4, Auctionator, Postal, Pawn, TitanPanel, WIM, TacoTip, Wakingdream Companion) with download + extract + uninstall
- Auto-update via `electron-updater` against the same patches server
- PLAY button: writes `realmlist.wtf`, launches WoW via chosen wrapper

## Development

```bash
npm install
npm run dev           # Electron + Vite dev server with HMR
```

## Build

```bash
npm run build         # Vite build + electron-builder → release/<AppImage|exe|dmg>
```

`electron-builder` produces a `latest-linux.yml` (Linux) / `latest.yml` (Win/Mac) alongside the installer; these are uploaded to `https://patches.wakingdream.cc/launcher/` so existing installs auto-update on next start.

## Layout

- `electron/` — main process (IPC, file ops, autoUpdater, addon install, wow launch)
- `src/` — React renderer (pages, components, types)
- `assets/logo/` — brand artwork (12 launcher icon sizes + dragon medallion)
- `package.json` `build.publish` — electron-updater target URL

## License

MIT
