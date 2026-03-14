// ─────────────────────────────────────────────────────────────────────────────
// ChatResponse — Displays the RAG AI response with citations + confidence
// ─────────────────────────────────────────────────────────────────────────────

import { ConfidenceBadge } from '@/components/ui/ConfidenceBadge';
import { SourcePill } from '@/components/ui/SourcePill';

// Simple markdown-ish bold renderer (handles **text**)
function renderAnswer(text) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="text-white">{part.slice(2, -2)}</strong>;
    }
    return <span key={i}>{part}</span>;
  });
}

export function ChatResponse({ response, loading, error }) {
  if (loading) {
    return (
      <div className="flex items-center gap-2 px-4 py-3 text-slate-400 text-sm">
        <span className="flex gap-1">
          <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:0ms]" />
          <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:150ms]" />
          <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce [animation-delay:300ms]" />
        </span>
        <span className="text-xs">CarbonLens AI is analyzing…</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 py-3 text-red-400 text-sm bg-red-500/10 rounded-lg mx-2 mb-2">
        AI service temporarily unavailable. Pre-generated recommendations are shown above.
      </div>
    );
  }

  if (!response) return null;

  return (
    <div className="px-4 py-3 border-t border-slate-700/50 bg-slate-900/50">
      {/* Meta row */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-slate-500 text-xs">CarbonLens AI</span>
        <ConfidenceBadge level={response.confidence} />
        {response.time_ms && (
          <span className="text-slate-600 text-xs ml-auto">
            {(response.time_ms / 1000).toFixed(1)}s
          </span>
        )}
      </div>

      {/* Answer text */}
      <div className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
        {renderAnswer(response.answer)}
      </div>

      {/* Sources */}
      {response.sources?.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {response.sources.map(s => (
            <SourcePill key={s.name || s} label={s.name || s} />
          ))}
        </div>
      )}
    </div>
  );
}
