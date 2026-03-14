// ─────────────────────────────────────────────────────────────────────────────
// Header — Top navigation bar  —  PRD §11.1
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useCityContext } from '@/context/CityContext';
import { useCities } from '@/hooks/useCities';

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
    // Always navigate to the map so the detail panel is visible
    navigate('/');
  };

  const navLinkClass = ({ isActive }) => `
    text-xs font-medium px-3 py-1.5 rounded-lg
    border transition-colors
    ${isActive
      ? 'text-white bg-blue-600/20 border-blue-500/50'
      : 'text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border-slate-700 hover:border-slate-500'
    }
  `;

  return (
    <header className="bg-slate-900 border-b border-slate-700 h-14 px-6 flex items-center justify-between relative z-[1001]">
      {/* Logo */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-6 rounded-md bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
            C
          </div>
          <span className="text-white font-bold text-base tracking-tight">CarbonLens</span>
          <span className="text-blue-400 font-light text-base">AI</span>
        </div>
        <span className="text-slate-600 text-xs hidden sm:block">
          US Cities Carbon Intelligence
        </span>
      </div>

      {/* Nav tabs */}
      <nav className="flex items-center gap-1.5 flex-shrink-0 mx-4">
        <NavLink to="/"         end className={navLinkClass}>Analysis</NavLink>
        <NavLink to="/rankings"     className={navLinkClass}>Rankings</NavLink>
      </nav>

      {/* Search bar */}
      <div className="relative flex-1 max-w-sm mx-2">
        <input
          type="text"
          value={searchQuery}
          onChange={e => { setSearchQuery(e.target.value); setShowResults(true); }}
          onFocus={() => setShowResults(true)}
          onBlur={() => setTimeout(() => setShowResults(false), 150)}
          placeholder="Search cities…"
          className="
            w-full bg-slate-800 text-white text-sm
            rounded-full px-4 py-1.5
            border border-slate-600 focus:border-blue-500 focus:outline-none
            placeholder:text-slate-500
            transition-colors
          "
          aria-label="Search cities"
        />

        {/* Search results dropdown */}
        {showResults && results.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-slate-600 rounded-lg shadow-xl overflow-hidden z-10">
            {results.map(city => (
              <button
                key={city.city_id}
                onMouseDown={() => handleSelect(city)}
                className="w-full text-left px-4 py-2 hover:bg-slate-700 flex items-center justify-between"
              >
                <span className="text-white text-sm">{city.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 text-xs">{city.state}</span>
                  {city.has_bps && (
                    <span className="text-amber-400 text-xs">⚖ BPS</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Compare + version */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={openCompare}
          className="
            text-slate-300 hover:text-white text-xs font-medium
            bg-slate-800 hover:bg-slate-700
            px-3 py-1.5 rounded-lg
            border border-slate-700 hover:border-slate-500
            transition-colors
            flex items-center gap-1.5
          "
          aria-label="Compare cities"
        >
          <span>⇄</span>
          <span className="hidden sm:inline">Compare</span>
        </button>

        <div className="text-slate-700 text-xs hidden md:block px-2">
          v3.1
        </div>
      </div>
    </header>
  );
}
