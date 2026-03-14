// ─────────────────────────────────────────────────────────────────────────────
// ComparisonGrid — Side-by-side city comparison table  —  PRD §07
// ─────────────────────────────────────────────────────────────────────────────

import { formatCO2e, formatPerCapita, formatTrendYoY, formatPct } from '@/lib/formatters';
import { getEmissionColor } from '@/lib/colors';

const ROWS = [
  { label: 'Total CO₂e', key: 'total_co2e_mt', format: formatCO2e },
  { label: 'Per Capita', key: 'co2e_per_capita', format: formatPerCapita },
  {
    label: 'YoY Trend',
    key: 'trend_yoy',
    format: (v) => {
      const t = formatTrendYoY(v);
      return t?.label || '—';
    },
    colorFn: (v) => {
      if (v == null) return '';
      return v < 0 ? 'text-emerald-400' : v > 0 ? 'text-red-400' : 'text-slate-300';
    },
  },
  { label: 'Population', key: 'population', format: (v) => v?.toLocaleString() || '—' },
  {
    label: 'BPS Standard',
    key: 'bps_name',
    format: (v) => v || 'None',
    colorFn: (v) => v ? 'text-emerald-400' : 'text-slate-500',
  },
  { label: 'Solar GHI', key: 'solar_ghi', format: (v) => v ? `${v} kWh/m²/d` : '—' },
  {
    label: 'Grid Renewable',
    key: 'grid_renewable_pct',
    format: formatPct,
    colorFn: (v) => v > 50 ? 'text-emerald-400' : v > 25 ? 'text-amber-400' : 'text-slate-300',
  },
];

export function ComparisonGrid({ cities }) {
  if (!cities?.length) return null;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-700">
            <th className="text-left text-slate-500 text-xs font-medium py-3 pr-4 w-32">
              Metric
            </th>
            {cities.map(c => (
              <th key={c.city_id} className="text-left py-3 px-3">
                <div className="text-white font-semibold">{c.name}</div>
                <div className="text-slate-500 text-xs">{c.state}</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ROWS.map(row => (
            <tr key={row.key} className="border-b border-slate-800 hover:bg-slate-800/30">
              <td className="py-3 pr-4 text-slate-500 text-xs font-medium">{row.label}</td>
              {cities.map(c => {
                const val = c[row.key];
                const formatted = row.format ? row.format(val) : val ?? '—';
                const colorClass = row.colorFn ? row.colorFn(val) : 'text-white';
                return (
                  <td key={c.city_id} className={`py-3 px-3 font-medium ${colorClass}`}>
                    {formatted}
                  </td>
                );
              })}
            </tr>
          ))}

          {/* Emissions color row */}
          <tr className="border-b border-slate-800">
            <td className="py-3 pr-4 text-slate-500 text-xs font-medium">Risk Level</td>
            {cities.map(c => (
              <td key={c.city_id} className="py-3 px-3">
                <span
                  className="inline-block w-3 h-3 rounded-full mr-2"
                  style={{ backgroundColor: getEmissionColor(c.co2e_per_capita) }}
                />
                <span className="text-slate-300 text-xs">
                  {c.co2e_per_capita < 5
                    ? 'Low'
                    : c.co2e_per_capita < 10
                    ? 'Moderate'
                    : c.co2e_per_capita < 15
                    ? 'High'
                    : 'Very High'}
                </span>
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
