import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Required for sending HTTP-only cookies (refresh token)
});

// Request Interceptor: Attach Access Token from client storage/state
apiClient.interceptors.request.use(
  (config) => {
    // We are using 'jwt_token' as it's the standard token key used throughout the app (e.g. useAuthStore)
    const token = typeof window !== 'undefined' ? localStorage.getItem('jwt_token') : null;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor: Handle Token Expiration (401)
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If response is 401 and we haven't already retried
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Attempt to call endpoint that reads refresh token cookie
        const { data } = await axios.post(
          `${apiClient.defaults.baseURL}/auth/refresh`,
          {},
          { withCredentials: true }
        );

        // The backend returns { success: true, token: newAccessToken }
        const newAccessToken = data.token;
        localStorage.setItem('jwt_token', newAccessToken);

        // Update default headers and retry original request
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed (e.g. token expired/invalid); clear state & redirect to login
        localStorage.removeItem('jwt_token');
        if (typeof window !== 'undefined') {
          window.location.href = '/login?expired=true';
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
