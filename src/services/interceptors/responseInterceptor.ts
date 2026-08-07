import type { AxiosError, AxiosResponse } from 'axios';
import { useAuthStore } from '@store/auth';

export const onResponse = (response: AxiosResponse): AxiosResponse => {
  return response;
};

export const onResponseError = (error: AxiosError): Promise<never> => {
  if (error.response?.status === 401) {
    useAuthStore.getState().setIsAuthenticated(false);
  }

  return Promise.reject(error);
};
