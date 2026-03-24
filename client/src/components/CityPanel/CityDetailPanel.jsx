// ─────────────────────────────────────────────────────────────────────────────
// CityDetailPanel — Persistent right column showing full city profile
// PRD §11.1 — always visible, in-flow, city content shown on city selection
// ─────────────────────────────────────────────────────────────────────────────

import { useCityContext } from '@/context/CityContext';
import { useCity } from '@/hooks/useCity';
import { EmissionsDonut } from './EmissionsDonut';
import { TrendChart } from './TrendChart';
import { BPSMeter } from './BPSMeter';
import { RecsCards } from './RecsCards';
import { WhatIfSlider } from '@/components/WhatIf/WhatIfSlider';
import { Skeleton } from '@/components/ui/Skeleton';
import { SourcePill } from '@/components/ui/SourcePill';
import { formatCO2e, formatPerCapita, formatTrendYoY, formatNumber, formatPct } from '@/lib/formatters';

function PanelSection({ title, children }) {
  return (
    <div className="border-b border-slate-800 pb-5 mb-5 last:border-b-0 last:mb-0 last:pb-0">
      <h3 className="text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3">
        {title}
      </h3>
      {children}
    </div>
  );
}

function KeyMetric({ label, value, sub, accent }) {
  return (
    <div className="bg-slate-800/60 rounded-lg p-3 border border-slate-700/50">
      <div className="text-slate-500 text-xs mb-1">{label}</div>
      <div className={`font-semibold text-sm ${accent || 'text-white'}`}>{value}</div>
      {sub && <div className="text-slate-600 text-xs mt-0.5">{sub}</div>}
    </div>
  );
}

export function CityDetailPanel() {
  const { panelOpen, closePanel, selectedCityId } = useCityContext();
  const { city, loading, error } = useCity();

  const trend = city ? formatTrendYoY(city.trend_yoy) : null;

  return (
    <aside className="flex flex-col flex-1 overflow-hidden bg-[#111c2b]" aria-label="City detail panel">

      {/* ── Persistent panel header ──────────────────────────────────── */}
      <div className="flex-shrink-0 border-b border-white/8 px-5 py-5 flex items-start justify-between">
        <div>
          <h2 className="text-white font-bold text-base">Emissions Solutions Analysis</h2>
          <p className="text-slate-500 text-xs mt-1">In-depth AI curated carbon emission reduction solutions</p>
        </div>
        {panelOpen && (
          <button
            onClick={closePanel}
            className="text-slate-500 hover:text-white transition-colors ml-2 flex-shrink-0 p-1"
            aria-label="Close panel"
          >
            ✕
          </button>
        )}
      </div>

      {/* ── Scrollable body ──────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">

        {/* Empty state — no city selected */}
        {!panelOpen && (
          <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
            <div className="text-4xl mb-4">🗺</div>
            <p className="text-slate-400 text-sm font-medium">Select a city on the map</p>
            <p className="text-slate-600 text-xs mt-1.5 leading-relaxed">
              Click any circle marker to explore emissions data, trends, and AI-powered sustainability recommendations
            </p>
          </div>
        )}

        {/* City content — shown when city is selected */}
        {panelOpen && (
          <>
            {/* ── City subheader ───────────────────────────────────── */}
            <div className="sticky top-0 z-10 bg-slate-900 border-b border-slate-700 px-5 py-4">
              {loading || !city ? (
                <div className="space-y-1.5">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-3 w-24" />
                </div>
              ) : (
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-white text-base font-bold">{city.name}</h3>
                    <span className="text-slate-400 text-sm">{city.state}</span>
                    {city.has_bps && (
                      <span className="bg-emerald-500/20 text-emerald-400 text-xs font-bold px-2 py-0.5 rounded-full">
                        ⚖ BPS
                      </span>
                    )}
                  </div>
                  <div className="text-slate-500 text-xs mt-0.5">
                    Pop. {formatNumber(city.population)} · Climate Zone {city.climate_zone}
                  </div>
                </div>
              )}
            </div>

            {/* Error state */}
            {error && (
              <div className="m-5 bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400 text-sm">
                Failed to load city data.{' '}
                <button
                  onClick={() => window.location.reload()}
                  className="underline hover:no-underline"
                >
                  Try again
                </button>
              </div>
            )}

            {/* ── Content sections ─────────────────────────────────── */}
            <div className="px-5 py-5 space-y-0">

              {/* Emissions Overview */}
              <PanelSection title="Emissions Overview">
                {loading ? (
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-16 rounded-lg" />)}
                  </div>
                ) : city ? (
                  <div className="grid grid-cols-2 gap-2 mb-4">
                    <KeyMetric
                      label="Total CO₂e (2023)"
                      value={formatCO2e(city.total_co2e_mt)}
                      sub={`[Source: Climate TRACE ${city.co2e_year || 2023}]`}
                    />
                    <KeyMetric
                      label="Per Capita"
                      value={formatPerCapita(city.co2e_per_capita)}
                      sub="tCO₂e/person"
                    />
                    <KeyMetric
                      label="Year-on-Year Trend"
                      value={trend?.label || '—'}
                      accent={trend?.positive === true ? 'text-emerald-400' : trend?.positive === false ? 'text-red-400' : 'text-slate-300'}
                      sub={trend?.positive === true ? 'Emissions declining' : 'Emissions rising'}
                    />
                    <KeyMetric
                      label="Grid Renewable"
                      value={formatPct(city.grid?.renewable_pct)}
                      sub={city.grid?.region}
                    />
                  </div>
                ) : null}

                {selectedCityId && (
                  <EmissionsDonut cityId={selectedCityId} />
                )}
              </PanelSection>

              {/* 5-Year Trend */}
              <PanelSection title="5-Year Emissions Trend">
                {selectedCityId && <TrendChart cityId={selectedCityId} />}
                <p className="text-slate-600 text-xs mt-2">
                  [Source: Climate TRACE 2024 · EPA GHGRP]
                </p>
              </PanelSection>

              {/* BPS Compliance */}
              <PanelSection title="Building Performance Standard">
                <BPSMeter city={city} loading={loading} />
              </PanelSection>

              {/* Renewable Profile */}
              {city && (
                <PanelSection title="Renewable Energy Profile">
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    <KeyMetric
                      label="Solar GHI"
                      value={`${city.renewables?.solar_ghi || '—'}`}
                      sub="kWh/m²/day"
                    />
                    <KeyMetric
                      label="Wind Avg"
                      value={`${city.renewables?.wind_avg || '—'} m/s`}
                      sub="wind speed"
                    />
                    <KeyMetric
                      label="Rooftop Potential"
                      value={`${(city.renewables?.rooftop_mw || 0).toLocaleString()} MW`}
                      sub="NREL estimate"
                    />
                  </div>

                  {city.renewables?.incentives?.length > 0 && (
                    <div>
                      <div className="text-slate-500 text-xs mb-2">Available Incentives (DSIRE)</div>
                      <div className="space-y-1.5">
                        {city.renewables.incentives.map(inc => (
                          <div
                            key={inc.name}
                            className="flex items-center justify-between text-xs bg-slate-800/60 rounded px-3 py-2"
                          >
                            <span className="text-white">{inc.name}</span>
                            <span className="text-emerald-400 font-medium">{inc.value}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </PanelSection>
              )}

              {/* What-If Scenario */}
              {city && (
                <PanelSection title="What-If Scenario">
                  <WhatIfSlider city={city} />
                </PanelSection>
              )}

              {/* AI Recommendations */}
              {selectedCityId && (
                <PanelSection title="AI Sustainability Recommendations">
                  <RecsCards cityId={selectedCityId} />
                </PanelSection>
              )}

              {/* Data Source Footer */}
              {city && (
                <div className="pt-2 border-t border-slate-800">
                  <div className="text-slate-600 text-xs mb-2">Data Sources</div>
                  <div className="flex flex-wrap gap-1">
                    {(city.data_sources || []).map(s => (
                      <SourcePill key={s} label={s} />
                    ))}
                    <SourcePill label={`Updated ${city.last_updated || '—'}`} />
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </aside>
  );
}
