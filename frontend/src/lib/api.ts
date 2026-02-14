import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

export const getMediaUrl = (path: string) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  // Prepend the backend URL for relative upload paths
  const baseUrl = API_URL.replace('/api', '');
  return `${baseUrl}/${path}`;
};

// Attach token
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('zamex_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  // Remove content-type if data is FormData to let browser set boundary
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  }
  return config;
});

// Auto refresh on 401
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refreshToken = localStorage.getItem('zamex_refresh');
        if (!refreshToken) throw new Error('No refresh token');
        const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });
        const { accessToken, refreshToken: newRefresh } = data.data.tokens;
        localStorage.setItem('zamex_token', accessToken);
        localStorage.setItem('zamex_refresh', newRefresh);
        original.headers.Authorization = `Bearer ${accessToken}`;
        return api(original);
      } catch {
        localStorage.removeItem('zamex_token');
        localStorage.removeItem('zamex_refresh');
        if (typeof window !== 'undefined') window.location.href = '/auth';
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  }
);
