import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
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

// Single-flight refresh promise to prevent concurrent refresh races
let refreshPromise: Promise<string> | null = null;

// Response Interceptor: Handle Token Expiration (401) with single-flight refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If response is 401, not already retried, and not the refresh request itself
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/refresh')
    ) {
      originalRequest._retry = true;

      try {
        if (!refreshPromise) {
          refreshPromise = (async () => {
            try {
              const { data } = await axios.post(
                `${apiClient.defaults.baseURL}/auth/refresh`,
                {},
                { withCredentials: true }
              );

              const newAccessToken = data?.token;
              if (!newAccessToken) {
                throw new Error('No access token returned from refresh endpoint');
              }

              localStorage.setItem('jwt_token', newAccessToken);
              return newAccessToken;
            } catch (err) {
              localStorage.removeItem('jwt_token');
              localStorage.removeItem('auth-storage');
              if (typeof window !== 'undefined') {
                window.location.href = '/login?expired=true';
              }
              throw err;
            } finally {
              refreshPromise = null;
            }
          })();
        }

        const newAccessToken = await refreshPromise;

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }
        return apiClient(originalRequest);
      } catch (refreshError) {
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
