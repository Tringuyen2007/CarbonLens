// ─────────────────────────────────────────────────────────────────────────────
// RankingsPage — Sortable city emissions table
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCities } from '@/hooks/useCities';
import { useCityContext } from '@/context/CityContext';
import { formatCO2e, formatPerCapita, formatTrendYoY, formatPct } from '@/lib/formatters';
import { getEmissionColor } from '@/lib/colors';
import { Skeleton } from '@/components/ui/Skeleton';

const COLUMNS = [
  { key: 'rank',            label: '#',              sortKey: null,               width: 'w-10'   },
  { key: 'name',            label: 'City',           sortKey: 'name',             width: 'w-44'   },
  { key: 'total_co2e_mt',   label: 'Total CO₂e',     sortKey: 'total_co2e_mt',    width: 'w-32'   },
  { key: 'co2e_per_capita', label: 'Per Capita',     sortKey: 'co2e_per_capita',  width: 'w-28'   },
  { key: 'trend_yoy',       label: 'YoY Trend',      sortKey: 'trend_yoy',        width: 'w-24'   },
  { key: 'has_bps',         label: 'BPS',            sortKey: 'has_bps',          width: 'w-20'   },
];

function SortIcon({ active, direction }) {
  if (!active) return <span className="text-slate-600 ml-1">↕</span>;
  return <span className="text-blue-400 ml-1">{direction === 'asc' ? '↑' : '↓'}</span>;
}

function TrendCell({ value }) {
  if (value == null) return <span className="text-slate-500">—</span>;
  const { label, positive } = formatTrendYoY(value);
  return (
    <span className={positive ? 'text-emerald-400' : 'text-red-400'}>
      {label}
    </span>
  );
}

function BPSCell({ hasBps, bpsName }) {
  if (!hasBps) return <span className="text-slate-600 text-xs">—</span>;
  return (
    <span className="inline-flex items-center gap-1 bg-amber-500/10 text-amber-400 text-xs font-medium px-2 py-0.5 rounded-full border border-amber-500/20">
      ⚖ Active
    </span>
  );
}

export function RankingsPage() {
  const { cities, loading, error } = useCities();
  const { selectCity } = useCityContext();
  const navigate = useNavigate();

  const [sortKey, setSortKey]       = useState('total_co2e_mt');
  const [sortDir, setSortDir]       = useState('desc');
  const [hoveredRow, setHoveredRow] = useState(null);

  const handleSort = (key) => {
    if (!key) return;
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const handleCityClick = (city) => {
    selectCity(city.city_id);
    navigate('/');
  };

  const sorted = [...(cities || [])].sort((a, b) => {
    const av = a[sortKey];
    const bv = b[sortKey];
    if (av == null) return 1;
    if (bv == null) return -1;
    if (typeof av === 'boolean') {
      return sortDir === 'desc' ? Number(bv) - Number(av) : Number(av) - Number(bv);
    }
    if (typeof av === 'string') {
      return sortDir === 'asc'
        ? av.localeCompare(bv)
        : bv.localeCompare(av);
    }
    return sortDir === 'asc' ? av - bv : bv - av;
  });

  return (
    <div className="flex-1 overflow-y-auto bg-slate-950 px-6 py-6">
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-white">City Emissions Rankings</h1>
        <p className="text-slate-400 text-sm mt-1">
          {cities.length} US cities · 2023 data · Click any row to explore on the map
        </p>
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-red-900/20 border border-red-700/40 text-red-400 text-sm rounded-lg px-4 py-3 mb-4">
          Failed to load cities. Please try again.
        </div>
      )}

      {/* Table */}
      <div className="bg-slate-900 border border-slate-700/50 rounded-xl overflow-hidden">
        {/* Table header */}
        <div className="grid grid-cols-[2.5rem_11rem_8rem_7rem_6rem_5rem_1fr] border-b border-slate-700/50 bg-slate-800/60">
          {COLUMNS.map(col => (
            <button
              key={col.key}
              onClick={() => handleSort(col.sortKey)}
              disabled={!col.sortKey}
              className={`
                px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider
                ${col.sortKey ? 'hover:text-white cursor-pointer' : 'cursor-default'}
                ${sortKey === col.sortKey ? 'text-white' : ''}
              `}
            >
              {col.label}
              {col.sortKey && (
                <SortIcon active={sortKey === col.sortKey} direction={sortDir} />
              )}
            </button>
          ))}
          {/* Spacer for action column */}
          <div />
        </div>

        {/* Skeleton rows while loading */}
        {loading && (
          <div className="divide-y divide-slate-700/30">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="grid grid-cols-[2.5rem_11rem_8rem_7rem_6rem_5rem_1fr] px-0 py-3">
                {COLUMNS.map(col => (
                  <div key={col.key} className="px-4 flex items-center">
                    <Skeleton className="h-3.5 w-16 rounded" />
                  </div>
                ))}
                <div />
              </div>
            ))}
          </div>
        )}

        {/* Data rows */}
        {!loading && (
          <div className="divide-y divide-slate-700/30">
            {sorted.map((city, idx) => {
              const color = getEmissionColor(city.co2e_per_capita);
              const isHovered = hoveredRow === city.city_id;

              return (
                <button
                  key={city.city_id}
                  onClick={() => handleCityClick(city)}
                  onMouseEnter={() => setHoveredRow(city.city_id)}
                  onMouseLeave={() => setHoveredRow(null)}
                  className={`
                    w-full grid grid-cols-[2.5rem_11rem_8rem_7rem_6rem_5rem_1fr]
                    text-left transition-colors duration-100
                    ${isHovered ? 'bg-slate-800/60' : 'bg-transparent'}
                  `}
                  aria-label={`View ${city.name} details`}
                >
                  {/* Rank */}
                  <div className="px-4 py-3.5 text-slate-500 text-sm tabular-nums">
                    {idx + 1}
                  </div>

                  {/* City name + state */}
                  <div className="px-4 py-3.5 flex items-center gap-2">
                    {/* Color dot matching map marker color */}
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: color }}
                    />
                    <span className="text-white text-sm font-medium truncate">
                      {city.name}
                    </span>
                    <span className="text-slate-500 text-xs flex-shrink-0">
                      {city.state}
                    </span>
                  </div>

                  {/* Total CO2e */}
                  <div className="px-4 py-3.5 text-slate-200 text-sm tabular-nums">
                    {formatCO2e(city.total_co2e_mt)}
                  </div>

                  {/* Per capita */}
                  <div className="px-4 py-3.5 text-sm tabular-nums" style={{ color }}>
                    {formatPerCapita(city.co2e_per_capita)}
                  </div>

                  {/* YoY trend */}
                  <div className="px-4 py-3.5 text-sm">
                    <TrendCell value={city.trend_yoy} />
                  </div>

                  {/* BPS badge */}
                  <div className="px-4 py-3.5">
                    <BPSCell hasBps={city.has_bps} />
                  </div>

                  {/* Arrow hint */}
                  <div className="px-4 py-3.5 flex items-center justify-end">
                    <span className={`text-slate-600 text-xs transition-colors ${isHovered ? 'text-slate-400' : ''}`}>
                      View →
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer attribution */}
      <p className="text-slate-600 text-xs mt-4">
        Source: Climate TRACE 2024 · EPA GHGRP · EIA API
      </p>
    </div>
  );
}
