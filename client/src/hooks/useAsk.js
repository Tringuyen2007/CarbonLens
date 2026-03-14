// Hook for the RAG AI chat endpoint

import { useState, useCallback } from 'react';
import { askQuestion } from '@/lib/api';

export function useAsk() {
  const [response, setResponse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const ask = useCallback(async (query, cityId) => {
    if (!query?.trim()) return;
    setLoading(true);
    setError(null);
    setResponse(null);
    try {
      const result = await askQuestion(query, cityId);
      setResponse(result);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setResponse(null);
    setError(null);
  }, []);

  return { response, loading, error, ask, reset };
}
