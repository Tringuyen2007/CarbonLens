// ─────────────────────────────────────────────────────────────────────────────
// RecsCards — AI sustainability recommendation cards
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react';
import { getRecommendations } from '@/lib/api';
import { useGenerate } from '@/hooks/useGenerate';
import { ConfidenceBadge } from '@/components/ui/ConfidenceBadge';
import { SourcePill } from '@/components/ui/SourcePill';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  Building2, Sun, Bus, Factory, Zap, ClipboardList, Thermometer, Leaf,
  Download, Sparkles
} from 'lucide-react';

const CATEGORY_ICONS = {
  building_electrification: Building2,
  solar: Sun,
  transit: Bus,
  industrial: Factory,
  grid: Zap,
  policy: ClipboardList,
  building_efficiency: Thermometer,
  default: Leaf,
};

function RecCard({ rec }) {
  const [expanded, setExpanded] = useState(false);
  const IconComponent = CATEGORY_ICONS[rec.category] || CATEGORY_ICONS.default;

  return (
    <div className="bg-slate-800 rounded-lg p-4 border-l-4 border-amber-500">
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <IconComponent size={18} className="flex-shrink-0 text-amber-400" />
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

function formatTimestamp(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) +
    ' · ' + d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

async function exportPDF(containerRef, cityName) {
  const { default: html2canvas } = await import('html2canvas');
  const { default: jsPDF } = await import('jspdf');

  const canvas = await html2canvas(containerRef.current, {
    backgroundColor: '#0f172a',
    scale: 2,
    useCORS: true,
  });

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const imgHeight = (canvas.height * pageWidth) / canvas.width;

  let y = 0;
  while (y < imgHeight) {
    if (y > 0) pdf.addPage();
    pdf.addImage(imgData, 'PNG', 0, -y, pageWidth, imgHeight);
    y += pageHeight;
  }

  pdf.save(`CarbonLens_${cityName.replace(/\s+/g, '_')}_Analysis.pdf`);
}

// ── Analyze + Export button ───────────────────────────────────────────────────

export function AnalyzeButton({ cityId, cityName, onAnalyzed }) {
  const { loading, error, generate } = useGenerate(cityId);
  const [done, setDone] = useState(false);

  // If parent already has recs (from cache), start in done state
  useEffect(() => { setDone(false); }, [cityId]);

  const handleAnalyze = () => {
    generate((result) => {
      setDone(true);
      onAnalyzed?.(result);
    });
  };

  const handleExport = () => {
    const target = document.getElementById('recs-export-target');
    if (target) exportPDF({ current: target }, cityName);
  };

  return (
    <div className="flex items-center gap-2">
      {error && (
        <span className="text-red-400 text-xs">{error}</span>
      )}
      {done ? (
        <button
          onClick={handleExport}
          className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
        >
          <Download size={13} />
          Export PDF
        </button>
      ) : (
        <button
          onClick={handleAnalyze}
          disabled={loading}
          className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-60 disabled:cursor-not-allowed text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
        >
          {loading ? (
            <>
              <span className="inline-flex gap-0.5">
                <span className="w-1 h-1 bg-white rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="w-1 h-1 bg-white rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="w-1 h-1 bg-white rounded-full animate-bounce [animation-delay:300ms]" />
              </span>
              Analyzing…
            </>
          ) : <><Sparkles size={13} /> Analyze</>}
        </button>
      )}
    </div>
  );
}

// ── Main RecsCards ────────────────────────────────────────────────────────────

export function RecsCards({ cityId, overrideRecs }) {
  const [recs, setRecs] = useState(null);
  const [loading, setLoading] = useState(false);

  // Fresh result from Analyze button takes priority
  useEffect(() => {
    if (overrideRecs) setRecs(overrideRecs);
  }, [overrideRecs]);

  // Try to load cached recs on city change
  useEffect(() => {
    if (!cityId) return;
    setRecs(null);
    setLoading(true);
    getRecommendations(cityId)
      .then(setRecs)
      .catch(() => setRecs(null))   // 404 = not yet analyzed, show empty state
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

  if (!recs) {
    return (
      <div className="text-center py-6 px-4">
        <Sparkles size={24} className="mb-2 text-slate-500 mx-auto" />
        <p className="text-slate-400 text-sm font-medium">No analysis yet</p>
        <p className="text-slate-600 text-xs mt-1">
          Click <span className="text-amber-400 font-semibold">Analyze</span> above to generate AI-powered recommendations for this city.
        </p>
      </div>
    );
  }

  return (
    <div id="recs-export-target">
      {recs.generated_at && (
        <p className="text-slate-600 text-xs mb-3">
          Last analyzed {formatTimestamp(recs.generated_at)}
        </p>
      )}
      <div className="space-y-3">
        {recs.recommendations?.map(rec => (
          <RecCard key={rec.rank} rec={rec} />
        ))}
      </div>
    </div>
  );
}
