// ─────────────────────────────────────────────────────────────────────────────
// MapLegend — Color & size legend overlay on the map
// ─────────────────────────────────────────────────────────────────────────────

const COLOR_ENTRIES = [
  { color: '#2563EB', label: '< 5 tCO₂e/capita' },
  { color: '#F59E0B', label: '5–10 tCO₂e/capita' },
  { color: '#EA580C', label: '10–15 tCO₂e/capita' },
  { color: '#DC2626', label: '> 15 tCO₂e/capita' },
];

export function MapLegend() {
  return (
    <div className="absolute bottom-8 left-4 z-[1000] bg-slate-900/90 backdrop-blur border border-slate-700 rounded-lg p-3 text-xs text-slate-300 shadow-lg">
      <div className="font-semibold text-white mb-2">CO₂e Per Capita</div>
      <div className="space-y-1.5">
        {COLOR_ENTRIES.map(({ color, label }) => (
          <div key={color} className="flex items-center gap-2">
            <span
              className="inline-block w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: color }}
            />
            <span>{label}</span>
          </div>
        ))}
      </div>

      <div className="border-t border-slate-700 mt-2.5 pt-2.5 space-y-1">
        <div className="font-semibold text-white mb-1">Marker Encoding</div>
        <div className="flex items-center gap-2">
          <span className="inline-block w-3 h-3 rounded-full bg-slate-500 flex-shrink-0" />
          <span>Size = total emissions</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-block w-3 h-3 rounded-full border-2 border-amber-400 bg-transparent flex-shrink-0" />
          <span>Gold ring = BPS active</span>
        </div>
      </div>
    </div>
  );
}
