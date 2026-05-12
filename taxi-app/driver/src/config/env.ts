export const env = {
  apiUrl: process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000/api',
  socketUrl: process.env.EXPO_PUBLIC_SOCKET_URL ?? 'http://localhost:3000',
  mapboxToken: process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? '',
};
