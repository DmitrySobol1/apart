import axios, { AxiosError } from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL ?? '/api';

const client = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

client.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (!error.response) {
      return Promise.reject(new Error('Connection error. Check your internet and try again.'));
    }

    const status = error.response.status;

    if (status === 400) {
      return Promise.reject(new Error('Invalid request. Please check your input.'));
    }

    if (status === 502 || status === 504) {
      return Promise.reject(new Error('Service temporarily unavailable. Please try again in a moment.'));
    }

    if (status >= 500) {
      return Promise.reject(new Error('Something went wrong. Please try again.'));
    }

    return Promise.reject(error);
  },
);

export default client;
