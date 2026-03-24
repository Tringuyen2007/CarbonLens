// ─────────────────────────────────────────────────────────────────────────────
// AIChatBar — AI chat panel at the bottom of the map column
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react';
import { useCityContext } from '@/context/CityContext';
import { useAsk } from '@/hooks/useAsk';
import { ChatResponse } from './ChatResponse';

export function AIChatBar() {
  const { selectedCityId } = useCityContext();
  const { response, loading, error, ask, reset } = useAsk();
  const [input, setInput] = useState('');
  const [minimized, setMinimized] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    const query = input.trim();
    if (!query) return;
    ask(query, selectedCityId);
  };

  const handleClear = () => {
    reset();
    setInput('');
  };

  return (
    <div className="flex-shrink-0 bg-[#111c2b] border-t border-white/8">

      {/* ── Header row — always visible, click to collapse ────────────── */}
      <button
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/4 transition-colors"
        onClick={() => setMinimized(m => !m)}
        aria-label={minimized ? 'Expand AI chat' : 'Collapse AI chat'}
      >
        <div className="flex items-center gap-3">
          {/* Bot icon */}
          <div className="w-8 h-8 rounded-full bg-emerald-600/25 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
            <span className="text-emerald-400 text-xs">✦</span>
          </div>
          <div className="text-left">
            <div className="text-white text-sm font-semibold leading-tight">AI Emissions Analyst</div>
            {!minimized && (
              <div className="text-slate-500 text-xs mt-0.5">Ask me anything about the emissions data</div>
            )}
          </div>
        </div>
        <span
          className={`text-slate-500 text-sm transition-transform duration-200 ${minimized ? 'rotate-180' : ''}`}
          aria-hidden
        >
          ∨
        </span>
      </button>

      {/* ── Body — hidden when minimized ─────────────────────────────── */}
      {!minimized && (
        <>
          {/* Chat display area */}
          <div className="px-4 pb-2">
            {(response || loading || error) ? (
              <div className="max-h-48 overflow-y-auto">
                <ChatResponse response={response} loading={loading} error={error} />
              </div>
            ) : (
              /* Default greeting */
              <div className="flex items-start gap-2.5 py-1">
                <div className="w-7 h-7 rounded-full bg-emerald-600/80 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-white text-xs">✦</span>
                </div>
                <div className="bg-slate-800/60 border border-white/5 rounded-lg px-3 py-2.5 text-slate-300 text-sm leading-relaxed">
                  Hello! I am your CO₂e emissions analysis assistant. How can I help you today?
                </div>
              </div>
            )}
          </div>

          {/* ── Input row ──────────────────────────────────────────────── */}
          <div className="px-4 pb-3.5">
            <form onSubmit={handleSubmit} className="flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder={
                  selectedCityId
                    ? `Ask about ${selectedCityId.toUpperCase()}… or any US city`
                    : 'Ask about emissions trends, data…'
                }
                className="
                  flex-1 bg-[#0d1b2a] text-white text-sm
                  rounded-lg px-4 py-2
                  border border-slate-700/50 focus:border-emerald-500/40 focus:outline-none
                  placeholder:text-slate-600
                  transition-colors
                "
                disabled={loading}
                aria-label="AI query input"
              />

              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="
                  bg-emerald-700 hover:bg-emerald-600
                  disabled:bg-slate-700/60 disabled:cursor-not-allowed
                  text-white
                  w-9 h-9 rounded-lg flex-shrink-0
                  flex items-center justify-center
                  transition-colors
                "
                aria-label="Send"
              >
                {loading ? '…' : '→'}
              </button>

              {(response || error) && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="
                    text-slate-500 hover:text-white transition-colors
                    w-9 h-9 flex items-center justify-center flex-shrink-0
                  "
                  aria-label="Clear response"
                >
                  ✕
                </button>
              )}
            </form>
          </div>
        </>
      )}
    </div>
  );
}
