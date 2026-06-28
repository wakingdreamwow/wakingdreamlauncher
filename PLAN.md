# Wakingdream Launcher — Implementation Plan

## Phase A: MVP (~3 days)
- [ ] Electron + Vite + React + TS scaffold
- [ ] Welcome / Onboarding wizard UI
- [ ] Client-detect (file picker + Wow.exe build verification)
- [ ] Patch manifest fetch from `https://patches.wakingdream.cc/manifest.json`
- [ ] Patch download with progress + SHA256 verify
- [ ] Realmlist auto-write to `<WoW_dir>/realmlist.wtf`
- [ ] WoW.exe spawn
- [ ] Backend `/api/launcher/manifest` endpoint in FCMS

## Phase B: Polish (~2 days)
- [ ] News feed (markdown + remote URL)
- [ ] Account-Register form → POST to FCMS /api/register
- [ ] Live Server Status panel (online players, boss state)
- [ ] Branding + theme polish (Wakingdream logo + color palette)
- [ ] Settings screen (WoW dir override, patch dir, etc.)

## Phase C: Distribution (~1 day)
- [ ] electron-builder configs (Windows MSI, Linux AppImage, macOS dmg)
- [ ] electron-updater self-update
- [ ] Download page on wakingdream.cc
- [ ] Code-signing (optional, can do later)

## Phase D: Curated Addons Manager (~1 day)
- [ ] Addons tab UI
- [ ] Per-addon checkboxes + descriptions + sizes
- [ ] Download from `patches.wakingdream.cc/addons/<name>.zip`
- [ ] Auto-extract to `<WoW_dir>/Interface/AddOns/`
- [ ] Curated list:
  - DBM, Recount, Atlas+AtlasLoot, Bartender4
  - Auctionator, Postal, Pawn, TitanPanel
  - WIM, TacoTip
  - Wakingdream-Companion (eigenes Addon)

## Total: ~7 working days
