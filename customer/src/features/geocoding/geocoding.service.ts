import { AddressSuggestion } from '../../shared/api/types';
import { env } from '../../shared/config/env';

type MapboxFeature = {
  id: string;
  text?: string;
  place_name?: string;
  center?: [number, number];
  place_type?: string[];
};

type MapboxGeocodingResponse = {
  features?: MapboxFeature[];
  message?: string;
};

const TASHKENT_PROXIMITY = '69.2401,41.2995';
const MAPBOX_GEOCODING_URL = 'https://api.mapbox.com/geocoding/v5/mapbox.places';

export async function searchAddress(query: string): Promise<AddressSuggestion[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) {
    return [];
  }
  if (!env.mapboxAccessToken) {
    throw new Error('MAPBOX_TOKEN_MISSING');
  }

  const url = new URL(`${MAPBOX_GEOCODING_URL}/${encodeURIComponent(trimmed)}.json`);
  url.searchParams.set('access_token', env.mapboxAccessToken);
  url.searchParams.set('country', 'uz');
  url.searchParams.set('language', 'ru');
  url.searchParams.set('proximity', TASHKENT_PROXIMITY);
  url.searchParams.set('limit', '6');
  url.searchParams.set('types', 'address,poi,place,locality,neighborhood');

  const response = await fetch(url.toString());
  if (response.status === 429) {
    throw new Error('MAPBOX_RATE_LIMIT');
  }
  if (!response.ok) {
    throw new Error('MAPBOX_NETWORK_ERROR');
  }

  const body = (await response.json()) as MapboxGeocodingResponse;
  return (body.features ?? [])
    .filter((feature) => feature.center?.length === 2)
    .map((feature) => ({
      id: feature.id,
      name: feature.text ?? feature.place_name ?? 'Адрес',
      fullAddress: feature.place_name ?? feature.text ?? 'Адрес',
      lat: feature.center![1],
      lng: feature.center![0],
      placeType: feature.place_type?.[0] ?? 'place',
    }));
}
