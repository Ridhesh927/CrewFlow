// Base configuration for API calls
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export const fetchApi = async (endpoint, options = {}) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('jwt_token') : null;
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Fastify body parser crashes if Content-Type is application/json but body is empty for these methods
  if (!options.body && options.method && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(options.method.toUpperCase())) {
    options.body = JSON.stringify({});
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
