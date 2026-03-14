// ─────────────────────────────────────────────────────────────────────────────
// RecsCards — AI sustainability recommendation cards
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react';
import { getRecommendations } from '@/lib/api';
import { ConfidenceBadge } from '@/components/ui/ConfidenceBadge';
import { SourcePill } from '@/components/ui/SourcePill';
import { Skeleton } from '@/components/ui/Skeleton';

const CATEGORY_ICONS = {
  building_electrification: '🏢',
  solar: '☀️',
  transit: '🚌',
  industrial: '🏭',
  grid: '⚡',
  policy: '📋',
  building_efficiency: '🌡️',
  default: '🌱',
};

function RecCard({ rec }) {
  const [expanded, setExpanded] = useState(false);
  const icon = CATEGORY_ICONS[rec.category] || CATEGORY_ICONS.default;

  return (
    <div className="bg-slate-800 rounded-lg p-4 border-l-4 border-amber-500">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-lg flex-shrink-0">{icon}</span>
          <span className="text-white text-sm font-semibold leading-snug">{rec.title}</span>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className="text-emerald-400 text-xs font-bold">
            −{rec.impact_pct}%
          </span>
          <ConfidenceBadge level={rec.confidence} />
        </div>
      </div>

      <p className={`text-slate-400 text-xs leading-relaxed ${expanded ? '' : 'line-clamp-2'}`}>
        {rec.description}
      </p>

      {rec.description?.length > 120 && (
        <button
          onClick={() => setExpanded(e => !e)}
          className="text-blue-400 text-xs mt-1 hover:text-blue-300 transition-colors"
        >
          {expanded ? 'Show less' : 'Read more'}
        </button>
      )}

      {rec.sources?.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {rec.sources.map(s => (
            <SourcePill key={s} label={s} />
          ))}
        </div>
      )}
    </div>
  );
}

export function RecsCards({ cityId }) {
  const [recs, setRecs] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!cityId) return;
    setLoading(true);
    setError(null);
    getRecommendations(cityId)
      .then(setRecs)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [cityId]);

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-slate-800 rounded-lg p-4 border-l-4 border-slate-700">
            <Skeleton className="h-4 w-40 mb-2" />
            <Skeleton className="h-3 w-full mb-1" />
            <Skeleton className="h-3 w-3/4" />
          </div>
        ))}
      </div>
    );
  }

  if (error || !recs) {
    return (
      <div className="text-slate-500 text-sm italic">
        Recommendations being generated…
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {recs.recommendations?.map(rec => (
        <RecCard key={rec.rank} rec={rec} />
      ))}
    </div>
  );
}
