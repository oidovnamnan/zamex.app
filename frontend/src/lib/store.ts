import { create } from 'zustand';
import { api } from './api';

interface User {
  id: string;
  phone: string;
  firstName: string;
  lastName?: string;
  role: string;
  companyId?: string;
  company?: {
    id: string;
    name: string;
    isVerified: boolean;
    verificationStatus: string;
  };
  avatarUrl?: string;
  isVerified?: boolean;
  verificationStatus?: string;
  customerCompanies?: any[];
  referralCode?: string;
  loyaltyPoints?: number;
  isConsolidationHold?: boolean;
}

interface AuthStore {
  user: User | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  login: (phone: string, password: string) => Promise<any>;
  register: (phone: string, firstName: string, password: string) => Promise<any>;
  requestOtp: (phone?: string, email?: string) => Promise<any>;
  verifyOtp: (otp: string, phone?: string, email?: string) => Promise<any>;
  firebaseVerify: (idToken: string, firstName?: string, password?: string) => Promise<any>;
  logout: () => void;
  fetchMe: () => Promise<void>;
}

export const useAuth = create<AuthStore>((set) => ({
  user: null,
  loading: true,

  setUser: (user) => set({ user, loading: false }),

  login: async (phone: string, password: string) => {
    set({ loading: true });
    try {
      const { data } = await api.post('/auth/login', { phone, password });
      if (data.data.tokens) {
        localStorage.setItem('zamex_token', data.data.tokens.accessToken);
        localStorage.setItem('zamex_refresh', data.data.tokens.refreshToken);
        set({ user: data.data.user, loading: false });
      }
      return data;
    } finally {
      set({ loading: false });
    }
  },

  register: async (phone: string, firstName: string, password: string) => {
    set({ loading: true });
    try {
      const { data } = await api.post('/auth/register', { phone, firstName, password });
      return data;
    } finally {
      set({ loading: false });
    }
  },

  requestOtp: async (phone?: string, email?: string) => {
    set({ loading: true });
    try {
      const { data } = await api.post('/auth/otp/request', { phone, email });
      return data;
    } finally {
      set({ loading: false });
    }
  },

  verifyOtp: async (otp: string, phone?: string, email?: string) => {
    set({ loading: true });
    try {
      const { data } = await api.post('/auth/otp/verify', { otp, phone, email });
      if (data.data.tokens) {
        localStorage.setItem('zamex_token', data.data.tokens.accessToken);
        localStorage.setItem('zamex_refresh', data.data.tokens.refreshToken);
        set({ user: data.data.user, loading: false });
      }
      return data;
    } finally {
      set({ loading: false });
    }
  },

  firebaseVerify: async (idToken: string, firstName?: string, password?: string) => {
    set({ loading: true });
    try {
      const { data } = await api.post('/auth/firebase/verify', { idToken, firstName, password });
      if (data.data.tokens) {
        localStorage.setItem('zamex_token', data.data.tokens.accessToken);
        localStorage.setItem('zamex_refresh', data.data.tokens.refreshToken);
        set({ user: data.data.user, loading: false });
      }
      return data;
    } finally {
      set({ loading: false });
    }
  },

  logout: () => {
    const refresh = localStorage.getItem('zamex_refresh');
    if (refresh) api.post('/auth/logout', { refreshToken: refresh }).catch(() => { });
    localStorage.removeItem('zamex_token');
    localStorage.removeItem('zamex_refresh');
    set({ user: null, loading: false });
  },

  fetchMe: async () => {
    set({ loading: true });
    try {
      const token = localStorage.getItem('zamex_token');
      if (!token) { set({ user: null, loading: false }); return; }
      const { data } = await api.get('/auth/me');
      set({ user: data.data.user, loading: false });
    } catch {
      set({ user: null, loading: false });
    }
  },
}));

