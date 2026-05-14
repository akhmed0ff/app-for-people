'use client';

import axios from 'axios';

function getApiBaseUrl() {
  const configured = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (!configured) {
    return 'http://localhost:3000/api/v1';
  }

  const normalized = configured.replace(/\/$/, '');
  if (normalized.endsWith('/api/v1')) {
    return normalized;
  }
  if (normalized.endsWith('/api')) {
    return `${normalized}/v1`;
  }
  return `${normalized}/api/v1`;
}

export const api = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('admin.accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (process.env.NODE_ENV === 'development') {
      const status = axios.isAxiosError(error) ? error.response?.status : undefined;
      const message = axios.isAxiosError(error)
        ? error.response?.data?.message ?? error.message
        : error instanceof Error
          ? error.message
          : 'Unknown error';
      console.warn('[admin-api] request failed', {
        baseURL: api.defaults.baseURL,
        status,
        message,
      });
    }
    return Promise.reject(error);
  },
);
