import apiClient from '@/lib/api-client';

// Base configuration for API calls
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

/**
 * Unified API request executor routing all calls through the canonical apiClient.
 * Ensures consistent authentication, token refresh, and 401 handling across the app.
 */
export const executeApiRequest = async (endpoint: string, options: RequestInit & { body?: any } = {}) => {
  const method = ((options.method as string) || 'GET').toUpperCase();
  let data = options.body;

  if (typeof data === 'string') {
    try {
      data = JSON.parse(data);
    } catch {
      // Keep raw string if not valid JSON
    }
  }

  try {
    const response = await apiClient.request({
      url: endpoint,
      method: method as any,
      data,
      headers: options.headers as any,
    });

    return response.data;
  } catch (err: any) {
    const message =
      err?.response?.data?.error ||
      err?.response?.data?.message ||
      err?.message ||
      'API request failed';
    const errorObj = new Error(message);
    (errorObj as any).response = err?.response;
    (errorObj as any).status = err?.response?.status;
    throw errorObj;
  }
};

/**
 * Unified file download executor using the canonical apiClient with blob response.
 */
export const executeFileDownload = async (
  endpoint: string,
  filename?: string,
  options: RequestInit = {}
): Promise<Blob> => {
  try {
    const response = await apiClient.get(endpoint, {
      responseType: 'blob',
      headers: options.headers as any,
    });

    const blob = new Blob([response.data]);

    if (filename && typeof window !== 'undefined') {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    }

    return blob;
  } catch (err: any) {
    const message =
      err?.response?.data?.error ||
      err?.response?.data?.message ||
      err?.message ||
      'File download failed';
    throw new Error(message);
  }
};
