import axios from 'axios';
import { env } from '@config/env';
import { onRequest, onRequestError, onResponse, onResponseError } from '../interceptors';

export const axiosInstance = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: 15_000,
  headers: {
    'Content-Type': 'application/json',
  },
});

axiosInstance.interceptors.request.use(onRequest, onRequestError);
axiosInstance.interceptors.response.use(onResponse, onResponseError);
