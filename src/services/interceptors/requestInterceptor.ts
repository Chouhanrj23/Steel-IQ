import type { InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@store/auth';

export const onRequest = (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
  const { isAuthenticated } = useAuthStore.getState();

  if (isAuthenticated) {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.set('Authorization', `Bearer ${token}`);
    }
  }

  return config;
};

export const onRequestError = (error: unknown): Promise<never> => {
  return Promise.reject(error);
};
