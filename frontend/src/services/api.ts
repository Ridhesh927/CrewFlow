// Base configuration for API calls
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export const executeApiRequest = async (endpoint: string, options: RequestInit & { body?: any } = {}) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('jwt_token') : null;

  // Detect FormData — don't set Content-Type (browser sets it with boundary automatically)
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData;

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  const method = ((options.method as string) || 'GET').toUpperCase();

  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }

  // Fastify body parser crashes if Content-Type is application/json but body is empty
  if (!options.body && !isFormData && ['POST', 'PUT', 'PATCH'].includes(method)) {
    options.body = JSON.stringify({});
  }

  // Remove Content-Type for methods that cannot have a body
  if (['GET', 'HEAD', 'DELETE'].includes(method)) {
    delete headers['Content-Type'];
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    if (response.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('jwt_token');
      localStorage.removeItem('auth-storage'); // Also clear zustand storage if applicable
      window.location.href = '/login';
    }
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || error.message || 'API request failed');
  }

  return response.json();
};
