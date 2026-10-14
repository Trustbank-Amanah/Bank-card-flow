// components/FilterBalk.tsx
'use client';

import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';

interface FilterOptie {
  label: string;
  waarde: string;
  aantal?: number;
}

interface FilterBalkProps {
  /** Placeholder voor het zoekveld */
  placeholder?: string;
  /** Tabs/filters die naast het zoekveld verschijnen */
  filters?: FilterOptie[];
  /** Naam van de searchParam voor het zoekveld (default: 'q') */
  zoekParam?: string;
  /** Naam van de searchParam voor het filter (default: 'filter') */
  filterParam?: string;
  /** Huidige actieve filterwaarde (default: eerste filter of leeg) */
  actieveFilter?: string;
}

export function FilterBalk({
  placeholder = 'Zoeken...',
  filters,
  zoekParam = 'q',
  filterParam = 'filter',
  actieveFilter,
}: FilterBalkProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const huidigeZoek = searchParams.get(zoekParam) ?? '';
  const huidigeFilter = actieveFilter ?? searchParams.get(filterParam) ?? '';
  const [zoek, setZoek] = useState(huidigeZoek);

  // Sync met URL wanneer gebruiker navigeert (back/forward)
  useEffect(() => {
    setZoek(huidigeZoek);
  }, [huidigeZoek]);

  const updateParams = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value === null || value === '') {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateParams({ [zoekParam]: zoek });
  };

  const handleFilter = (waarde: string) => {
    updateParams({ [filterParam]: waarde });
  };

  const handleWissen = () => {
    setZoek('');
    updateParams({ [zoekParam]: null });
  };

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      {/* Filters/tabs */}
      {filters && filters.length > 0 && (
        <div className="flex gap-2 border-b border-gray-200">
          {filters.map((f) => {
            const actief = huidigeFilter === f.waarde;
            return (
              <button
                key={f.waarde}
                type="button"
                onClick={() => handleFilter(f.waarde)}
                className={`-mb-px border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
                  actief
                    ? 'border-gray-900 text-gray-900'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {f.label}
                {typeof f.aantal === 'number' && (
                  <span className="ml-2 text-xs text-gray-400">
                    ({f.aantal})
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Zoekveld */}
      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <input
          type="search"
          value={zoek}
          onChange={(e) => setZoek(e.target.value)}
          placeholder={placeholder}
          className="w-72 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900"
        />
        <button
          type="submit"
          className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Zoeken
        </button>
        {zoek && (
          <button
            type="button"
            onClick={handleWissen}
            className="text-sm text-gray-500 hover:text-gray-900"
          >
            Wissen
          </button>
        )}
      </form>
    </div>
  );
}