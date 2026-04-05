// ─────────────────────────────────────────────────────────────────────────────
// Header — Responsive: logo + fluid search left, nav + actions right
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useCityContext } from '@/context/CityContext';
import { useCities } from '@/hooks/useCities';
import { Sparkles, LayoutDashboard, BarChart2, Trophy, ArrowLeftRight, Scale } from 'lucide-react';

export function Header() {
  const { selectCity, openCompare } = useCityContext();
  const { cities } = useCities();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [showResults, setShowResults] = useState(false);

  const results = searchQuery.length > 1
    ? cities.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.state.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 6)
    : [];

  const handleSelect = (city) => {
    selectCity(city.city_id);
    setSearchQuery('');
    setShowResults(false);
    navigate('/analysis');
  };

  const navLinkClass = ({ isActive }) => `
    flex items-center gap-1.5
    text-xs font-medium px-3 py-1.5 rounded-md
    transition-colors duration-150 whitespace-nowrap
    ${isActive
      ? 'text-emerald-300 bg-emerald-600/25 border border-emerald-500/30'
      : 'text-slate-300 hover:text-white hover:bg-white/8 border border-transparent'
    }
  `;

  return (
    <header className="
      bg-[#1a3a2a] border-b border-white/8
      h-14 px-3 sm:px-6
      flex items-center gap-3
      relative z-[1001] flex-shrink-0
      min-w-0
    ">

      {/* ── Left: Logo + fluid search ────────────────────────────────── */}
      {/*
        flex-1 lets this section grow and fill available space.
        max-w-sm caps it so the search doesn't sprawl on wide screens.
        min-w-0 allows it to shrink below its natural content width.
      */}
      <div className="flex items-center gap-3 flex-1 min-w-0 max-w-sm">

        {/* Logo — icon always visible, text hidden on xs */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <img src="/logo.png" alt="CarbonLens logo" className="w-7 h-7 flex-shrink-0" />
          <span className="text-white font-semibold text-sm tracking-tight whitespace-nowrap hidden sm:block">
            CarbonLens AI
          </span>
        </div>

        {/* Search — fluid, min-width so it doesn't collapse entirely */}
        <div className="relative flex-1 min-w-[80px]">
          <input
            type="text"
            value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); setShowResults(true); }}
            onFocus={() => setShowResults(true)}
            onBlur={() => setTimeout(() => setShowResults(false), 150)}
            placeholder="Search cities…"
            className="
              w-full bg-white/5 text-white text-sm
              rounded-full px-4 py-1.5
              border border-white/10 focus:border-emerald-500/50 focus:outline-none
              placeholder:text-slate-500
              transition-colors
            "
            aria-label="Search cities"
          />

          {showResults && results.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-[#1a3a2a] border border-white/10 rounded-lg shadow-xl overflow-hidden z-10 min-w-[200px]">
              {results.map(city => (
                <button
                  key={city.city_id}
                  onMouseDown={() => handleSelect(city)}
                  className="w-full text-left px-4 py-2 hover:bg-white/5 flex items-center justify-between gap-2"
                >
                  <span className="text-white text-sm truncate">{city.name}</span>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-slate-500 text-xs">{city.state}</span>
                    {city.has_bps && (
                      <span className="text-amber-400 text-xs flex items-center gap-0.5"><Scale size={10} /> BPS</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Right: Nav + divider + Compare + version ─────────────────── */}
      {/*
        flex-shrink-0 keeps this group from being squeezed.
        Nav text labels collapse to icon-only on small screens via hidden/inline classes.
      */}
      <div className="flex items-center gap-1 flex-shrink-0 ml-auto">

        {/* Sparkle — decorative, hidden at small widths */}
        <Sparkles size={14} className="text-slate-500 mr-1 hidden lg:block" />

        {/* Nav links — icon always visible, label text on md+ */}
        <NavLink to="/" end className={navLinkClass}>
          <LayoutDashboard size={13} />
          <span className="hidden md:inline">Dashboard</span>
        </NavLink>
        <NavLink to="/analysis" className={navLinkClass}>
          <BarChart2 size={13} />
          <span className="hidden md:inline">Analysis</span>
        </NavLink>
        <NavLink to="/rankings" className={navLinkClass}>
          <Trophy size={13} />
          <span className="hidden md:inline">City Ranks</span>
        </NavLink>

        {/* Divider */}
        <div className="w-px h-4 bg-white/10 mx-1.5 flex-shrink-0" />

        {/* Compare */}
        <button
          onClick={openCompare}
          className="
            text-slate-300 hover:text-white text-xs font-medium
            bg-white/5 hover:bg-white/10
            px-3 py-1.5 rounded-md
            border border-white/10 hover:border-white/20
            transition-colors
            flex items-center gap-1.5 flex-shrink-0 whitespace-nowrap
          "
          aria-label="Compare cities"
        >
          <ArrowLeftRight size={13} />
          <span className="hidden sm:inline">Compare</span>
        </button>

        {/* Version — only on wide screens */}
        <div className="text-slate-600 text-xs hidden lg:block pl-1.5">
          v3.1
        </div>
      </div>
    </header>
  );
}
