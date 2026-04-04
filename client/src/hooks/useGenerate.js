import { useState, useCallback } from 'react';
import { generateRecommendations } from '@/lib/api';

export function useGenerate(cityId) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const generate = useCallback(async (onSuccess) => {
    if (!cityId) return;
    setLoading(true);
    setError(null);
    try {
      const result = await generateRecommendations(cityId);
      onSuccess?.(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [cityId]);

  return { loading, error, generate };
}
