// Hook for the AI Emission Analyst chat endpoint

import { useState, useCallback, useEffect } from 'react';
import { askQuestion } from '@/lib/api';

const MAX_HISTORY = 4; // matches backend MAX_HISTORY_TURNS
const STORAGE_KEY = 'carbonlens_chat_messages';

function loadMessages() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

export function useAsk() {
  const [messages, setMessages] = useState(() => loadMessages());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {
      // storage quota exceeded — silently ignore
    }
  }, [messages]);

  // Keep last response for ChatResponse component compatibility
  const response = messages.length > 0
    ? messages[messages.length - 1]._meta || null
    : null;

  const ask = useCallback(async (query, cityId) => {
    if (!query?.trim()) return;
    setLoading(true);
    setError(null);

    // Optimistically add user message
    const userMsg = { role: 'user', content: query };
    setMessages(prev => [...prev, userMsg]);

    // Build history to send: all prior turns (without _meta), capped
    const historyToSend = messages
      .filter(m => !m._meta || m.role === 'assistant')
      .map(({ role, content }) => ({ role, content }))
      .slice(-(MAX_HISTORY * 2));

    try {
      const result = await askQuestion(query, cityId, historyToSend);
      const assistantMsg = {
        role: 'assistant',
        content: result.answer,
        _meta: result,  // carries confidence, sources, time_ms for ChatResponse
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch (err) {
      setError(err);
      // Remove the optimistic user message on failure
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  }, [messages]);

  const reset = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  return { messages, response, loading, error, ask, reset };
}
