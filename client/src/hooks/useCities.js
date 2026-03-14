// Fetches all cities for the map (list endpoint)

import { useState, useEffect } from 'react';
import { getCities } from '@/lib/api';

export function useCities() {
  const [cities, setCities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getCities()
      .then(setCities)
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  return { cities, loading, error };
}
