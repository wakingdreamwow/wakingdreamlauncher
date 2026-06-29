/**
 * Tiny footer bar at the bottom of the launcher window — shows version + build date.
 * Injected via Vite define plugin in vite.config.ts (read from package.json + Date.now()).
 */
export function VersionFooter() {
  const dateLabel = (() => {
    const d = new Date(__APP_BUILD_DATE__);
    if (isNaN(d.getTime())) return __APP_BUILD_DATE__;
    return d.toISOString().slice(0, 16).replace('T', ' ') + ' UTC';
  })();
  return (
    <div className="h-6 flex items-center justify-end px-3 bg-nightmare/90 border-t border-smaragd/20 text-[10px] text-dawn/40 font-mono select-none">
      Wakingdream Launcher · v{__APP_VERSION__} · build {dateLabel}
    </div>
  );
}
