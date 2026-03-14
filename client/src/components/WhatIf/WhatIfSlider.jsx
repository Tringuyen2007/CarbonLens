// ─────────────────────────────────────────────────────────────────────────────
// WhatIfSlider — Interactive solar capacity scenario  —  PRD §12
// Client-side calculation only, no API call required.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useMemo } from 'react';
import { ImpactProjection } from './ImpactProjection';
import { formatMW } from '@/lib/formatters';

/**
 * Simplified solar impact model — PRD §12.3
 * Real solar impact depends on time-of-day profiles, marginal emissions rates,
 * and curtailment. This is an appropriate hackathon approximation.
 */
function calculateSolarImpact(city, addedMW) {
  if (!city || addedMW <= 0) return null;

  // solar_ghi in kWh/m²/day → capacity factor proxy (÷ peak sun hours 24h)
  const capacityFactor = (city.renewables?.solar_ghi || 4.5) / 24;
  const annualMWh = addedMW * capacityFactor * 8760;                  // MWh/yr
  const gridIntensity = (city.grid?.carbon_intensity || 400) / 1e6;   // tons/kWh
  const co2eReduction = annualMWh * 1000 * gridIntensity;             // tons CO₂e/yr
  const reductionPct = (co2eReduction / city.total_co2e_mt) * 100;
  const newTotal = city.total_co2e_mt - co2eReduction;

  return { co2eReduction, reductionPct, newTotal };
}

const MAX_MW = 2000;
const STEP = 50;

export function WhatIfSlider({ city }) {
  const [addedMW, setAddedMW] = useState(0);

  const impact = useMemo(
    () => calculateSolarImpact(city, addedMW),
    [city, addedMW]
  );

  if (!city) return null;

  return (
    <div className="bg-slate-800/60 rounded-lg p-4 border border-slate-700/50 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <span className="text-lg">☀️</span>
        <span className="text-white font-semibold text-sm">What If Scenario</span>
      </div>

      {/* Slider */}
      <div>
        <label className="text-xs text-slate-400 block mb-2">
          Add rooftop solar capacity to {city.name}:
          <span className="text-white font-bold ml-1">{formatMW(addedMW)}</span>
          {addedMW > 0 && (
            <span className="text-slate-500 ml-1">
              (existing: {formatMW(city.renewables?.rooftop_mw || 0)})
            </span>
          )}
        </label>

        <input
          type="range"
          min={0}
          max={MAX_MW}
          step={STEP}
          value={addedMW}
          onChange={e => setAddedMW(Number(e.target.value))}
          className="w-full h-2 bg-slate-700 rounded-full appearance-none cursor-pointer accent-amber-500"
          aria-label="Solar capacity to add in MW"
        />

        <div className="flex justify-between text-[10px] text-slate-600 mt-1">
          <span>0 MW</span>
          <span>{MAX_MW / 2} MW</span>
          <span>{MAX_MW} MW</span>
        </div>
      </div>

      {/* Impact — only shown when slider > 0 */}
      {addedMW > 0 ? (
        <ImpactProjection impact={impact} city={city} />
      ) : (
        <p className="text-slate-600 text-xs">
          Move the slider to model solar capacity additions and see projected CO₂e reduction.
        </p>
      )}
    </div>
  );
}
