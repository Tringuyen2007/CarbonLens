// ─────────────────────────────────────────────────────────────────────────────
// AIChatBar — AI Emission Analyst chat panel
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useRef, useEffect } from 'react';
import { useCityContext } from '@/context/CityContext';
import { useAsk } from '@/hooks/useAsk';
import { ChatResponse } from './ChatResponse';
import { Sparkles, ChevronDown, Send } from 'lucide-react';

function UserBubble({ content }) {
  return (
    <div className="flex justify-end">
      <div className="bg-emerald-700/40 border border-emerald-600/20 rounded-lg px-3 py-2 text-white text-sm max-w-[85%]">
        {content}
      </div>
    </div>
  );
}

function AssistantBubble({ msg, isLatest, loading }) {
  // Show ChatResponse (with sources/confidence) only for the latest assistant message
  if (isLatest && msg._meta) {
    return <ChatResponse response={msg._meta} loading={false} error={null} />;
  }
  return (
    <div className="flex items-start gap-2">
      <div className="w-6 h-6 rounded-full bg-emerald-600/80 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Sparkles size={12} className="text-white" />
      </div>
      <div className="bg-slate-800/60 border border-white/5 rounded-lg px-3 py-2 text-slate-300 text-sm leading-relaxed max-w-[85%]">
        {msg.content}
      </div>
    </div>
  );
}

export function AIChatBar() {
  const { selectedCityId } = useCityContext();
  const { messages, loading, error, ask, reset } = useAsk();
  const [input, setInput] = useState('');
  const [minimized, setMinimized] = useState(false);
  const bottomRef = useRef(null);

  // Auto-scroll to latest message
  useEffect(() => {
    if (!minimized) bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading, minimized]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const query = input.trim();
    if (!query) return;
    setInput('');
    ask(query, selectedCityId);
  };

  const handleClear = () => {
    reset();
    setInput('');
  };

  const hasConversation = messages.length > 0;

  return (
    <div className="flex-shrink-0 bg-[#111c2b] border-t border-white/8">

      {/* ── Header row ───────────────────────────────────────────────── */}
      <button
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/4 transition-colors"
        onClick={() => setMinimized(m => !m)}
        aria-label={minimized ? 'Expand AI chat' : 'Collapse AI chat'}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-emerald-600/25 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
            <Sparkles size={12} className="text-emerald-400" />
          </div>
          <div className="text-left">
            <div className="text-white text-sm font-semibold leading-tight">AI Emissions Analyst</div>
            {!minimized && (
              <div className="text-slate-500 text-xs mt-0.5">
                {hasConversation ? `${Math.ceil(messages.length / 2)} exchange${messages.length > 2 ? 's' : ''}` : 'Ask me anything about the emissions data'}
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {hasConversation && !minimized && (
            <button
              onClick={e => { e.stopPropagation(); handleClear(); }}
              className="text-slate-600 hover:text-slate-400 text-xs transition-colors px-1"
              aria-label="Clear conversation"
            >
              Clear
            </button>
          )}
          <ChevronDown
            size={16}
            className={`text-slate-500 transition-transform duration-200 ${minimized ? 'rotate-180' : ''}`}
            aria-hidden
          />
        </div>
      </button>

      {/* ── Body ─────────────────────────────────────────────────────── */}
      {!minimized && (
        <>
          <div className="px-4 pb-2 max-h-56 overflow-y-auto space-y-3">
            {!hasConversation && !loading ? (
              /* Greeting */
              <div className="flex items-start gap-2.5 py-1">
                <div className="w-7 h-7 rounded-full bg-emerald-600/80 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Sparkles size={12} className="text-white" />
                </div>
                <div className="bg-slate-800/60 border border-white/5 rounded-lg px-3 py-2.5 text-slate-300 text-sm leading-relaxed">
                  Hello! I am your CO₂e emissions analysis assistant. How can I help you today?
                </div>
              </div>
            ) : (
              /* Conversation thread */
              messages.map((msg, i) => (
                msg.role === 'user'
                  ? <UserBubble key={i} content={msg.content} />
                  : <AssistantBubble
                      key={i}
                      msg={msg}
                      isLatest={i === messages.length - 1}
                    />
              ))
            )}

            {/* Loading indicator */}
            {loading && (
              <div className="flex items-start gap-2">
                <div className="w-6 h-6 rounded-full bg-emerald-600/80 flex items-center justify-center flex-shrink-0">
                  <Sparkles size={12} className="text-white" />
                </div>
                <div className="bg-slate-800/60 border border-white/5 rounded-lg px-3 py-2">
                  <span className="inline-flex gap-1">
                    {[0, 150, 300].map(d => (
                      <span
                        key={d}
                        className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-bounce"
                        style={{ animationDelay: `${d}ms` }}
                      />
                    ))}
                  </span>
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="text-red-400 text-xs px-1">
                {error.message || 'Something went wrong. Try again.'}
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* ── Input row ────────────────────────────────────────────── */}
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
                  text-white w-9 h-9 rounded-lg flex-shrink-0
                  flex items-center justify-center transition-colors
                "
                aria-label="Send"
              >
                {loading ? '…' : <Send size={15} />}
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
