// Base configuration for API calls
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export const executeApiRequest = async (endpoint, options = {}) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('jwt_token') : null;
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const method = (options.method || 'GET').toUpperCase();

  // Fastify body parser crashes if Content-Type is application/json but body is empty
  if (!options.body && ['POST', 'PUT', 'PATCH'].includes(method)) {
    options.body = JSON.stringify({});
  }

  // Remove Content-Type for methods that cannot have a body so Fastify doesn't try to parse an empty body
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
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || error.message || 'API request failed');
  }
  
  return response.json();
};
