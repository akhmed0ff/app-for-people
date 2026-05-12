export const env = {
  apiUrl: process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000/api/v1',
  socketUrl: process.env.EXPO_PUBLIC_SOCKET_URL ?? 'http://localhost:3000/taxi',
  mapboxAccessToken: process.env.EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN ?? '',
};
