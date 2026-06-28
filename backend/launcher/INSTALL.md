# Install on fusioncms container

1. Copy `Launcher.php` to:
   ```
   /home/acore/fusioncms/web/application/modules/launcher/controllers/Launcher.php
   ```
   (create the `launcher` module dir if needed: `controllers/`, `models/`, `views/`)

2. Register routes — append to `application/config/routes.php`:
   ```php
   $route['api/launcher/manifest']  = 'launcher/launcher/manifest';
   $route['api/launcher/status']    = 'launcher/launcher/status';
   $route['api/launcher/news']      = 'launcher/launcher/news';
   $route['api/launcher/register']  = 'launcher/launcher/register';
   ```

3. Clear FCMS cache:
   ```bash
   rm -f /home/acore/fusioncms/web/writable/cache/data/*.cache
   ```

4. Test:
   ```bash
   curl https://wakingdream.cc/api/launcher/manifest
   curl https://wakingdream.cc/api/launcher/status
   ```
