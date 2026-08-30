import axios from 'axios';

const BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/+$/, '');

/**
 * Shared axios instance for all backend API calls.
 *
 * withCredentials: true — tells the browser to include the HTTP-only session
 * cookie in every request, even though the frontend (port 5173) and backend
 * (port 4000) are on different ports. Without this, cross-port requests won't
 * carry the cookie and all protected routes return 401.
 *
 * The backend reciprocates with:
 *   cors({ origin: env.FRONTEND_URL, credentials: true })
 */
export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
  withCredentials: true,  // Send session cookie on every request (cross-port)
});

// Response interceptor — normalize errors to plain Error instances
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
