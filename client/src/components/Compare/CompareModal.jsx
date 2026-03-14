// ─────────────────────────────────────────────────────────────────────────────
// CompareModal — City comparison overlay  —  PRD §07 /v1/compare
// Allows selecting 2-3 cities and shows side-by-side grid.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react';
import { useCityContext } from '@/context/CityContext';
import { useCities } from '@/hooks/useCities';
import { compareCities } from '@/lib/api';
import { ComparisonGrid } from './ComparisonGrid';
import { Skeleton } from '@/components/ui/Skeleton';

const MAX_CITIES = 3;

export function CompareModal() {
  const { compareOpen, closeCompare, selectedCityId } = useCityContext();
  const { cities: allCities } = useCities();
  const [selected, setSelected] = useState([]);
  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');

  // Pre-seed with selected city if available
  useEffect(() => {
    if (compareOpen && selectedCityId && !selected.includes(selectedCityId)) {
      setSelected([selectedCityId]);
    }
  }, [compareOpen, selectedCityId]);

  // Run comparison whenever selection changes
  useEffect(() => {
    if (selected.length < 2) {
      setComparison(null);
      return;
    }
    setLoading(true);
    setError(null);
    compareCities(selected)
      .then(data => setComparison(data.cities))
      .catch(setError)
      .finally(() => setLoading(false));
  }, [selected]);

  const toggleCity = (cityId) => {
    setSelected(prev => {
      if (prev.includes(cityId)) return prev.filter(id => id !== cityId);
      if (prev.length >= MAX_CITIES) return prev; // max 3
      return [...prev, cityId];
    });
  };

  const filteredCities = allCities.filter(c =>
    !search ||
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.state.toLowerCase().includes(search.toLowerCase())
  );

  if (!compareOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="City comparison"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={closeCompare}
      />

      {/* Modal */}
      <div className="relative bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
          <div>
            <h2 className="text-white font-bold text-lg">Compare Cities</h2>
            <p className="text-slate-500 text-xs mt-0.5">
              Select 2–3 cities to compare side-by-side
            </p>
          </div>
          <button
            onClick={closeCompare}
            className="text-slate-500 hover:text-white transition-colors text-xl p-1"
            aria-label="Close comparison"
          >
            ✕
          </button>
        </div>

        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* City selector sidebar */}
          <div className="w-56 flex-shrink-0 border-r border-slate-700 flex flex-col">
            <div className="p-3 border-b border-slate-700">
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search cities…"
                className="w-full bg-slate-800 text-white text-xs rounded-lg px-3 py-2 border border-slate-600 focus:border-blue-500 focus:outline-none"
              />
              <div className="text-slate-600 text-xs mt-1.5">
                {selected.length}/{MAX_CITIES} selected
              </div>
            </div>

            <div className="flex-1 overflow-y-auto py-1">
              {filteredCities.map(c => {
                const isSelected = selected.includes(c.city_id);
                const isDisabled = !isSelected && selected.length >= MAX_CITIES;
                return (
                  <button
                    key={c.city_id}
                    onClick={() => toggleCity(c.city_id)}
                    disabled={isDisabled}
                    className={`
                      w-full text-left px-3 py-2 text-xs transition-colors
                      ${isSelected
                        ? 'bg-blue-600/20 text-blue-300'
                        : isDisabled
                        ? 'text-slate-600 cursor-not-allowed'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'}
                    `}
                  >
                    <div className="flex items-center gap-2">
                      {isSelected && <span className="text-blue-400">✓</span>}
                      <span className={isSelected ? 'font-semibold' : ''}>{c.name}</span>
                    </div>
                    <div className="text-slate-600 ml-4">{c.state}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Comparison content */}
          <div className="flex-1 overflow-y-auto p-6">
            {selected.length < 2 ? (
              <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-2">
                <span className="text-4xl">↑</span>
                <p className="text-sm">Select at least 2 cities to compare</p>
              </div>
            ) : loading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map(i => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : error ? (
              <div className="text-red-400 text-sm">
                Failed to load comparison data.
              </div>
            ) : comparison ? (
              <ComparisonGrid cities={comparison} />
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
