// ─────────────────────────────────────────────────────────────────────────────
// NationalSummaryBanner — Aggregate stats strip above the map
// PRD §16: "instant context above map"
// ─────────────────────────────────────────────────────────────────────────────

import { useCities } from '@/hooks/useCities';
import { formatCO2e } from '@/lib/formatters';

export function NationalSummaryBanner() {
  const { cities } = useCities();

  const totalCO2e = cities.reduce((sum, c) => sum + c.total_co2e_mt, 0);
  const bpsCount = cities.filter(c => c.has_bps).length;
  const avgPerCapita =
    cities.length > 0
      ? cities.reduce((sum, c) => sum + c.co2e_per_capita, 0) / cities.length
      : 0;
  const declining = cities.filter(c => c.trend_yoy < 0).length;

  const stats = [
    { label: 'Cities Tracked', value: cities.length || '—' },
    { label: 'Total CO₂e (2023)', value: formatCO2e(totalCO2e) },
    { label: 'BPS Mandates Active', value: bpsCount || '—' },
    { label: 'Avg Per Capita', value: avgPerCapita ? `${avgPerCapita.toFixed(1)} t` : '—' },
    { label: 'Declining Emissions', value: `${declining}/${cities.length}` },
  ];

  return (
    <div className="bg-slate-900/95 border-b border-slate-700/60 px-6 py-2">
      <div className="flex items-center gap-6 overflow-x-auto">
        {stats.map(({ label, value }) => (
          <div key={label} className="flex items-center gap-2 whitespace-nowrap">
            <span className="text-slate-500 text-xs">{label}</span>
            <span className="text-white text-sm font-semibold">{value}</span>
          </div>
        ))}
        <div className="ml-auto text-slate-600 text-xs whitespace-nowrap">
          Sources: Climate TRACE 2024 · EPA GHGRP · EIA API
        </div>
      </div>
    </div>
  );
}
