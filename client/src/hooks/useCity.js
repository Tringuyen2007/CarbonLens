// Fetches full city profile when selectedCityId changes — PRD §11.2

import { useState, useEffect } from 'react';
import { useCityContext } from '@/context/CityContext';
import { getCity } from '@/lib/api';

export function useCity() {
  const { selectedCityId } = useCityContext();
  const [city, setCity] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!selectedCityId) {
      setCity(null);
      return;
    }
    setLoading(true);
    setError(null);
    getCity(selectedCityId)
      .then(setCity)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [selectedCityId]);

  return { city, loading, error };
}
