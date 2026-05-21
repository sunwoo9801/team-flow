import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api',
  withCredentials: true,
});

// Access Token 주입
api.interceptors.request.use(config => {
  const token = sessionStorage.getItem('access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// 401 → Refresh 자동 재시도
let isRefreshing = false;
let queue: Array<(token: string) => void> = [];

api.interceptors.response.use(
  res => res,
  async (error: import('axios').AxiosError) => {
    const original = error.config as import('axios').InternalAxiosRequestConfig & {
      _retry?: boolean;
    };
    if (error.response?.status === 401 && !original._retry) {
      if (isRefreshing) {
        return new Promise(resolve => {
          queue.push(token => {
            original.headers.Authorization = `Bearer ${token}`;
            resolve(api(original));
          });
        });
      }
      original._retry = true;
      isRefreshing = true;
      try {
        const { data } = await axios.post<{ accessToken: string }>(
          `${import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api'}/auth/refresh`,
          {},
          { withCredentials: true }
        );
        sessionStorage.setItem('access_token', data.accessToken);
        queue.forEach(cb => cb(data.accessToken));
        queue = [];
        original.headers.Authorization = `Bearer ${data.accessToken}`;
        return api(original);
      } catch {
        sessionStorage.removeItem('access_token');
        window.location.href = '/login';
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(error);
  }
);
