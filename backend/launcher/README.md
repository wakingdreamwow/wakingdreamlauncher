# FCMS Launcher Backend Module

PHP module for FusionCMS that exposes launcher endpoints:

- `GET /api/launcher/manifest` — current patch manifest (proxies to static manifest.json or DB-driven)
- `GET /api/launcher/status` — server status (online players, AH activity, boss spawn states)
- `POST /api/launcher/register` — inline account-register from launcher
- `GET /api/launcher/news` — patch notes / news feed

## Installation

Drop into FCMS `application/modules/launcher/`, then access at `https://wakingdream.cc/api/launcher/*`.
