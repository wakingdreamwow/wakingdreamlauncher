export function TitleBar() {
  const api = window.wakingdream;
  return (
    <div className="h-10 flex items-center justify-between px-4 bg-nightmare/95 border-b border-smaragd/30">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-full bg-smaragd flex items-center justify-center text-xs font-bold">W</div>
        <span className="font-display font-bold text-smaragd-light tracking-wide">WAKINGDREAM</span>
      </div>
      <div className="flex items-center gap-1">
        <button onClick={() => api?.minimize()} className="w-8 h-6 hover:bg-smaragd/20 rounded text-sm">_</button>
        <button onClick={() => api?.close()} className="w-8 h-6 hover:bg-red-600 rounded text-sm">×</button>
      </div>
    </div>
  );
}
