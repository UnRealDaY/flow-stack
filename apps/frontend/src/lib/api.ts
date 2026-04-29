import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

// In-memory access token — never stored in localStorage for security
let accessToken: string | null = null;

export const setAccessToken = (t: string | null) => { accessToken = t; };
export const getAccessToken = () => accessToken;

export const api = axios.create({
  baseURL: `${BASE}/api/v1`,
  withCredentials: true,   // send httpOnly refresh-token cookie
});

// Attach access token to every request
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// On 401, attempt one silent refresh then retry original request
let refreshing: Promise<void> | null = null;

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;

      if (!refreshing) {
        refreshing = api.post('/auth/refresh')
          .then((r) => { setAccessToken((r.data as { accessToken: string }).accessToken); })
          .catch(() => { setAccessToken(null); })
          .finally(() => { refreshing = null; });
      }

      await refreshing;

      if (accessToken) {
        original.headers.Authorization = `Bearer ${accessToken}`;
        return api(original);
      }
    }

    return Promise.reject(error);
  },
);

// Typed helpers
export type ApiError = { error: { code: string; message: string; details?: unknown } };

export const extractMessage = (err: unknown): string => {
  if (axios.isAxiosError(err)) {
    const d = err.response?.data as ApiError | undefined;
    return d?.error?.message ?? err.message;
  }
  return 'An unexpected error occurred.';
};
