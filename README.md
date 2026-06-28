# Wakingdream Launcher

Cross-platform game launcher for the **Wakingdream** WoW 3.3.5a private server.

## Features

- **Hybrid Client Model** — works with player's own 3.3.5a client (no Blizzard IP redistribution)
- **Patch Manifest Sync** — auto-downloads only changed MPQs via SHA256 delta
- **Realmlist Auto-Set** — no more editing `realmlist.wtf` manually
- **Curated Addons Manager** — one-click install of vetted addons (DBM, Recount, etc.)
- **Account Onboarding** — register + login inline
- **Live Server Status** — online players, AH activity, Hyjal world boss state
- **Patch Notes** — in-launcher news feed
- **Cross-Platform** — Windows, Linux, macOS

## Tech Stack

- Electron + TypeScript
- React + Tailwind CSS
- electron-vite (dev)
- electron-builder (distribution)

## License

MIT
