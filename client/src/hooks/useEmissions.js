// Fetches pre-aggregated emissions summary for Recharts

import { useState, useEffect } from 'react';
import { getEmissionsSummary } from '@/lib/api';

export function useEmissions(cityId) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!cityId) {
      setData(null);
      return;
    }
    setLoading(true);
    setError(null);
    getEmissionsSummary(cityId)
      .then(setData)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [cityId]);

  return { data, loading, error };
}
