import { createContext, useCallback, useContext, useState } from 'react';

type FiltersState = {
  minRating: number | null;
  distanceKm: number | null;
  setMinRating: (v: number | null) => void;
  setDistanceKm: (v: number | null) => void;
  clearFilters: () => void;
};

const FiltersContext = createContext<FiltersState>({
  minRating: null,
  distanceKm: null,
  setMinRating: () => {},
  setDistanceKm: () => {},
  clearFilters: () => {},
});

export function FiltersProvider({ children }: { children: React.ReactNode }) {
  const [minRating, setMinRating] = useState<number | null>(null);
  const [distanceKm, setDistanceKm] = useState<number | null>(null);

  const clearFilters = useCallback(() => {
    setMinRating(null);
    setDistanceKm(null);
  }, []);

  return (
    <FiltersContext.Provider value={{ minRating, distanceKm, setMinRating, setDistanceKm, clearFilters }}>
      {children}
    </FiltersContext.Provider>
  );
}

export function useFilters() {
  return useContext(FiltersContext);
}
