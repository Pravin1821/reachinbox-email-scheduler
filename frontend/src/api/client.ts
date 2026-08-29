import axios from 'axios';

const BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Request interceptor — attach auth token if available (currently unused
// because backend has no auth endpoints, but wired for future use)
apiClient.interceptors.request.use((config) => {
  const credential = localStorage.getItem('ri_credential');
  if (credential) {
    config.headers['Authorization'] = `Bearer ${credential}`;
  }
  return config;
});

// Response interceptor — normalize errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message: string =
      error.response?.data?.error ??
      error.response?.data?.message ??
      error.message ??
      'An unexpected error occurred';
    return Promise.reject(new Error(typeof message === 'string' ? message : JSON.stringify(message)));
  },
);

export default apiClient;
