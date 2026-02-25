import { useEffect, useState } from 'react';

type AddressSuggestion = {
  label: string;
  value: string;
};

type NominatimAddress = {
  city?: string;
  town?: string;
  village?: string;
  hamlet?: string;
  municipality?: string;
  road?: string;
  pedestrian?: string;
  street?: string;
  house_number?: string;
};

type NominatimItem = {
  display_name?: string;
  address?: NominatimAddress;
};

const buildShortAddress = (item: NominatimItem): string => {
  const city =
    item.address?.city ||
    item.address?.town ||
    item.address?.village ||
    item.address?.hamlet ||
    item.address?.municipality ||
    '';
  const street =
    item.address?.road || item.address?.pedestrian || item.address?.street || '';
  const house = item.address?.house_number || '';

  const assembled = [city, street, house].filter(Boolean).join(', ');
  if (assembled) return assembled;

  return (item.display_name || '')
    .split(',')
    .map(part => part.trim())
    .filter(Boolean)
    .slice(0, 3)
    .join(', ');
};

export const useAddressSuggestions = (query: string) => {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const value = query.trim();
    if (value.length < 3) {
      setSuggestions([]);
      return;
    }

    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      try {
        setIsLoading(true);
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=5&q=${encodeURIComponent(value)}`,
          {
            signal: controller.signal,
            headers: {
              Accept: 'application/json',
            },
          }
        );

        if (!response.ok) {
          setSuggestions([]);
          return;
        }

        const data = (await response.json()) as NominatimItem[];
        const normalized = data
          .map(item => {
            const label = item.display_name?.trim() || '';
            const value = buildShortAddress(item);
            return { label, value };
          })
          .filter(item => item.value)
          .slice(0, 5)
          .map(item => ({
            label: item.label || item.value,
            value: item.value,
          }));

        setSuggestions(normalized);
      } catch {
        if (!controller.signal.aborted) {
          setSuggestions([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }, 350);

    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [query]);

  return { suggestions, isLoading };
};
