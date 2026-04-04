// ─────────────────────────────────────────────────────────────────────────────
// RankingsPage — Responsive city sustainability rankings
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useMemo } from 'react';
import { Scale } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCities } from '@/hooks/useCities';
import { useCityContext } from '@/context/CityContext';
import { formatCO2e, formatTrendYoY } from '@/lib/formatters';
import { getEmissionColor } from '@/lib/colors';
import { Skeleton } from '@/components/ui/Skeleton';

// Derive a sustainability score (0–100) from available city fields.
// Lower per-capita + declining trend + BPS active = higher score.
function computeScore(city) {
  if (!city) return null;
  const perCapita = city.co2e_per_capita ?? 20;
  const trend     = city.trend_yoy ?? 0;
  let score = Math.max(0, 100 - perCapita * 3.5);
  if (trend < 0) score = Math.min(100, score + Math.abs(trend) * 5);
  if (city.has_bps) score = Math.min(100, score + 8);
  return Math.round(score);
}

function ScoreBar({ score }) {
  if (score == null) return <span className="text-slate-500 text-xs">—</span>;
  const color = score >= 70 ? '#34d399' : score >= 45 ? '#f59e0b' : '#f87171';
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 bg-slate-700 rounded-full overflow-hidden">
        <div className="h-full rounded-full" style={{ width: `${score}%`, backgroundColor: color }} />
      </div>
      <span className="text-xs tabular-nums" style={{ color }}>{score}</span>
    </div>
  );
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

const SORT_OPTIONS = [
  { label: 'Lowest Emissions',  key: 'total_co2e_mt',   dir: 'asc'  },
  { label: 'Highest Emissions', key: 'total_co2e_mt',   dir: 'desc' },
  { label: 'Best Score',        key: '_score',           dir: 'desc' },
  { label: 'Best Trend',        key: 'trend_yoy',        dir: 'asc'  },
  { label: 'City Name A–Z',     key: 'name',             dir: 'asc'  },
];

// Shared chevron svg for selects
const CHEVRON_BG = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2394a3b8' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`;
const SELECT_STYLE = { backgroundImage: CHEVRON_BG, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center', paddingRight: '28px' };

export function RankingsPage() {
  const { cities, loading, error } = useCities();
  const { selectCity } = useCityContext();
  const navigate = useNavigate();

  const [search,      setSearch]      = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [sortOption,  setSortOption]  = useState(0);
  const [hoveredRow,  setHoveredRow]  = useState(null);

  const allStates = useMemo(
    () => [...new Set((cities || []).map(c => c.state))].sort(),
    [cities]
  );

  const augmented = useMemo(
    () => (cities || []).map(c => ({ ...c, _score: computeScore(c) })),
    [cities]
  );

  const filtered = useMemo(() => {
    let list = augmented;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(c =>
        c.name.toLowerCase().includes(q) ||
        c.state.toLowerCase().includes(q)
      );
    }
    if (stateFilter) {
      list = list.filter(c => c.state === stateFilter);
    }
    return list;
  }, [augmented, search, stateFilter]);

  const sorted = useMemo(() => {
    const { key, dir } = SORT_OPTIONS[sortOption];
    return [...filtered].sort((a, b) => {
      const av = a[key];
      const bv = b[key];
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === 'string') {
        return dir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
      }
      return dir === 'asc' ? av - bv : bv - av;
    });
  }, [filtered, sortOption]);

  const handleCityClick = (city) => {
    selectCity(city.city_id);
    navigate('/analysis');
  };

  return (
    /*
      Page padding scales: tighter on mobile, comfortable on desktop.
      max-w + mx-auto centers content on very wide viewports.
    */
    <div className="flex-1 overflow-y-auto bg-[#0d1b2a] px-4 sm:px-6 lg:px-8 py-5 sm:py-7">

      {/* ── Page header row ──────────────────────────────────────────────── */}
      {/*
        flex-wrap so the "Apply AI Solution" card drops below on narrow screens
        instead of overlapping or shrinking the title.
      */}
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-4 mb-5 sm:mb-6">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-white leading-tight">
            City Sustainability Rankings
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            U.S cities ranked by carbon emissions and sustainability metrics
          </p>
        </div>

        {/* Apply AI Solution card — shrinks to icon-only treatment below sm */}
        <div className="flex-shrink-0">
          <button
            onClick={() => navigate('/analysis')}
            className="
              bg-emerald-700 hover:bg-emerald-600
              border border-emerald-500/40
              rounded-xl px-4 sm:px-5 py-3
              text-left transition-colors duration-150
            "
          >
            <div className="flex items-center justify-between gap-3 mb-1">
              <span className="text-white font-semibold text-sm whitespace-nowrap">Apply AI Solution</span>
              <span className="text-white text-sm">→</span>
            </div>
            <p className="text-emerald-200/70 text-xs leading-snug max-w-[200px]">
              Applies curated solution and increases new city rankings
            </p>
          </button>
        </div>
      </div>

      {/* ── Filters row ──────────────────────────────────────────────────── */}
      {/*
        flex-wrap so filters stack naturally on narrow screens.
        Search grows to fill available space; dropdowns stay compact.
      */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-4 sm:mb-5">
        {/* Search — grows */}
        <div className="relative flex-1 min-w-[160px] max-w-xs">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs pointer-events-none">🔍</span>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search cities..."
            className="
              w-full bg-[#131f2e] text-white text-sm
              rounded-lg pl-8 pr-4 py-2
              border border-slate-700/60 focus:border-emerald-500/50 focus:outline-none
              placeholder:text-slate-500
              transition-colors
            "
          />
        </div>

        {/* State filter */}
        <select
          value={stateFilter}
          onChange={e => setStateFilter(e.target.value)}
          className="
            bg-[#131f2e] text-slate-300 text-sm
            rounded-lg px-3 py-2
            border border-slate-700/60 focus:border-emerald-500/50 focus:outline-none
            appearance-none cursor-pointer
            min-w-[110px]
          "
          style={SELECT_STYLE}
        >
          <option value="">State</option>
          {allStates.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        {/* Sort */}
        <select
          value={sortOption}
          onChange={e => setSortOption(Number(e.target.value))}
          className="
            bg-[#131f2e] text-slate-300 text-sm
            rounded-lg px-3 py-2
            border border-slate-700/60 focus:border-emerald-500/50 focus:outline-none
            appearance-none cursor-pointer
            min-w-[155px]
          "
          style={SELECT_STYLE}
        >
          {SORT_OPTIONS.map((opt, i) => (
            <option key={i} value={i}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-red-900/20 border border-red-700/40 text-red-400 text-sm rounded-lg px-4 py-3 mb-4">
          Failed to load cities. Please try again.
        </div>
      )}

      {/* ── Table card ───────────────────────────────────────────────────── */}
      <div className="bg-[#111c2b] border border-slate-700/40 rounded-xl overflow-hidden">

        {/* Table card header */}
        <div className="px-5 py-3.5 border-b border-slate-700/40 flex items-center justify-between">
          <span className="text-white font-semibold text-sm">City Rankings</span>
          <span className="text-slate-500 text-xs">
            {loading ? 'Loading…' : `Showing ${sorted.length} cities`}
          </span>
        </div>

        {/*
          overflow-x-auto lets the table scroll horizontally on narrow screens
          rather than overflowing or breaking the card.
        */}
        <div className="overflow-x-auto">
          {/* Min-width keeps columns readable before horizontal scrolling kicks in */}
          <div className="min-w-[580px]">

            {/* Column headers */}
            <div className="grid grid-cols-[2.5rem_1fr_8rem_7rem_7rem_6rem] border-b border-slate-700/30 bg-slate-800/30">
              {['Rank', 'City', 'Emissions', 'Change', 'Renewable', 'Score'].map(label => (
                <div
                  key={label}
                  className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider"
                >
                  {label}
                </div>
              ))}
            </div>

            {/* Skeleton loading */}
            {loading && (
              <div className="divide-y divide-slate-700/20">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="grid grid-cols-[2.5rem_1fr_8rem_7rem_7rem_6rem] py-3">
                    {[1, 2, 3, 4, 5, 6].map(j => (
                      <div key={j} className="px-4 flex items-center">
                        <Skeleton className="h-3.5 w-14 rounded" />
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            )}

            {/* Data rows */}
            {!loading && (
              <div className="divide-y divide-slate-700/20">
                {sorted.length === 0 && (
                  <div className="px-5 py-12 text-center text-slate-500 text-sm">
                    No cities match your filters.
                  </div>
                )}
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
                        w-full grid grid-cols-[2.5rem_1fr_8rem_7rem_7rem_6rem]
                        text-left transition-colors duration-100
                        ${isHovered ? 'bg-slate-800/40' : 'bg-transparent'}
                      `}
                      aria-label={`View ${city.name} details`}
                    >
                      {/* Rank */}
                      <div className="px-4 py-3.5 text-slate-500 text-sm tabular-nums">
                        {idx + 1}
                      </div>

                      {/* City */}
                      <div className="px-4 py-3.5 flex items-center gap-2 min-w-0">
                        <span
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: color }}
                        />
                        <span className="text-white text-sm font-medium truncate">{city.name}</span>
                        <span className="text-slate-500 text-xs flex-shrink-0">{city.state}</span>
                      </div>

                      {/* Emissions */}
                      <div className="px-4 py-3.5 text-slate-200 text-sm tabular-nums">
                        {formatCO2e(city.total_co2e_mt)}
                      </div>

                      {/* Change */}
                      <div className="px-4 py-3.5 text-sm">
                        <TrendCell value={city.trend_yoy} />
                      </div>

                      {/* Renewable — BPS as proxy */}
                      <div className="px-4 py-3.5 text-sm">
                        {city.has_bps ? (
                          <span className="inline-flex items-center gap-1 bg-amber-500/10 text-amber-400 text-xs font-medium px-2 py-0.5 rounded-full border border-amber-500/20">
                            <Scale size={10} /> BPS
                          </span>
                        ) : (
                          <span className="text-slate-500 text-xs">—</span>
                        )}
                      </div>

                      {/* Score */}
                      <div className="px-4 py-3.5">
                        <ScoreBar score={city._score} />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer attribution */}
      <p className="text-slate-600 text-xs mt-4">
        Source: Climate TRACE 2024 · EPA GHGRP · EIA API
      </p>
    </div>
  );
}
