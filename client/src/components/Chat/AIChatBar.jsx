// ─────────────────────────────────────────────────────────────────────────────
// AIChatBar — Fixed bottom RAG query interface  —  PRD §11.1
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react';
import { useCityContext } from '@/context/CityContext';
import { useAsk } from '@/hooks/useAsk';
import { ChatResponse } from './ChatResponse';

const EXAMPLE_QUERIES = [
  'What are building emissions limits for NYC?',
  'Best renewable strategies for Houston?',
  'How does Seattle reduce building emissions?',
  'Compare solar potential in Phoenix vs Boston',
];

export function AIChatBar() {
  const { selectedCityId } = useCityContext();
  const { response, loading, error, ask, reset } = useAsk();
  const [input, setInput] = useState('');
  const [expanded, setExpanded] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    const query = input.trim();
    if (!query) return;
    ask(query, selectedCityId);
    setExpanded(true);
  };

  const handleExampleClick = (query) => {
    setInput(query);
    ask(query, selectedCityId);
    setExpanded(true);
  };

  const handleClear = () => {
    reset();
    setInput('');
    setExpanded(false);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900 border-t border-slate-700 shadow-2xl">
      {/* Response area — shown when there's a response */}
      {expanded && (
        <div className="max-h-64 overflow-y-auto">
          <ChatResponse response={response} loading={loading} error={error} />
        </div>
      )}

      {/* Input row */}
      <div className="p-3 flex items-center gap-2">
        <form onSubmit={handleSubmit} className="flex items-center gap-2 flex-1 min-w-0">
          <div className="relative flex-1">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={
                selectedCityId
                  ? `Ask about ${selectedCityId.toUpperCase()}… or any US city`
                  : 'Ask about any US city\'s emissions, compliance, or renewable energy potential…'
              }
              className="
                w-full bg-slate-800 text-white text-sm
                rounded-full px-4 py-2.5
                border border-slate-600 focus:border-blue-500 focus:outline-none
                placeholder:text-slate-500
                transition-colors
              "
              disabled={loading}
              aria-label="AI query input"
            />
          </div>

          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="
              bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:cursor-not-allowed
              text-white text-sm font-semibold
              px-4 py-2.5 rounded-full flex-shrink-0
              transition-colors
            "
            aria-label="Ask AI"
          >
            {loading ? '…' : 'Ask'}
          </button>

          {(response || error) && (
            <button
              type="button"
              onClick={handleClear}
              className="text-slate-500 hover:text-white transition-colors text-sm px-2 flex-shrink-0"
              aria-label="Clear response"
            >
              ✕
            </button>
          )}
        </form>
      </div>

      {/* Example queries — shown when no active response */}
      {!response && !loading && (
        <div className="px-3 pb-3 flex gap-2 overflow-x-auto">
          {EXAMPLE_QUERIES.map(q => (
            <button
              key={q}
              onClick={() => handleExampleClick(q)}
              className="
                text-xs text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700
                px-3 py-1.5 rounded-full whitespace-nowrap flex-shrink-0
                border border-slate-700 hover:border-slate-500
                transition-colors
              "
            >
              {q}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
