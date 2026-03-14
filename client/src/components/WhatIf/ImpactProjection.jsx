// ─────────────────────────────────────────────────────────────────────────────
// ImpactProjection — Displays calculated solar impact  —  PRD §12.2
// ─────────────────────────────────────────────────────────────────────────────

import { formatCO2e } from '@/lib/formatters';

export function ImpactProjection({ impact, city }) {
  if (!impact || !city) return null;

  const { co2eReduction, reductionPct, newTotal } = impact;

  return (
    <div className="bg-slate-900/60 rounded-lg p-3 space-y-2 border border-slate-700/50">
      <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
        Projected Impact
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <div className="text-xs text-slate-500">Emissions reduction</div>
          <div className="text-emerald-400 font-semibold text-sm">
            − {formatCO2e(co2eReduction)}/yr
          </div>
          <div className="text-emerald-400/70 text-xs">
            − {reductionPct.toFixed(2)}%
          </div>
        </div>

        <div>
          <div className="text-xs text-slate-500">New total (est.)</div>
          <div className="text-white font-semibold text-sm">
            {formatCO2e(Math.max(0, newTotal))}
          </div>
          <div className="text-slate-500 text-xs">
            vs {formatCO2e(city.total_co2e_mt)} today
          </div>
        </div>
      </div>

      {/* BPS compliance improvement */}
      {city.bps?.compliance_gap_pct > 0 && (
        <div>
          <div className="text-xs text-slate-500 mb-1">BPS compliance gap</div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-red-400">{city.bps.compliance_gap_pct}% over</span>
            <span className="text-slate-500">→</span>
            <span className="text-amber-400">
              {Math.max(0, city.bps.compliance_gap_pct - reductionPct).toFixed(1)}% over
            </span>
          </div>
          {/* Progress bar */}
          <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden mt-1">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, reductionPct * 5)}%` }}
            />
          </div>
        </div>
      )}

      <p className="text-slate-600 text-[10px] leading-relaxed">
        Simplified estimate. Actual impact depends on grid conditions, time-of-day generation profiles, and curtailment.
        [Source: NREL PVWatts, {city.grid?.region} grid data]
      </p>
    </div>
  );
}
