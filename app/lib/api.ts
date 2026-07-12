import axios from 'axios';

// 1. Create the instance
const api = axios.create({
  // Matches the env variable
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api',
  withCredentials: true, 
});

// 2. Request Interceptor (Attaches the Access Token)
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken'); 
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// 3. Response Interceptor (The Magic Refresh Logic)
api.interceptors.response.use(
  (response) => {
    // If the request succeeds normally, just return it
    return response; 
  },
  async (error) => {
    const originalRequest = error.config;

    // If error is 401, we haven't retried yet, and it's NOT the login/refresh route itself
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/login') &&
      !originalRequest.url?.includes('/refresh')
    ) {
      // No access token was sent — user is not logged in. Do not call /refresh or
      // redirect to login (matches warden pages that use fetch without hard redirects).
      const hadBearer =
        typeof originalRequest.headers?.Authorization === "string" &&
        originalRequest.headers.Authorization.startsWith("Bearer ");
      if (!hadBearer) {
        return Promise.reject(error);
      }

      originalRequest._retry = true; // Mark as retried to prevent infinite loops

      try {
        // Attempt to hit the backend refresh endpoint
        const refreshRes = await api.post('/refresh');

        // Grab the shiny new access token
        const newAccessToken = refreshRes.data.accessToken;

        // Save it to localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('accessToken', newAccessToken);
        }

        // Update the original request with the new token
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        // Retry the original request seamlessly!
        return api(originalRequest);
        
      } catch (refreshError) {
        // If the refresh token is ALSO expired, clear storage and kick to login
        console.error('Session expired. Redirecting to login.');
        if (typeof window !== 'undefined') {
          localStorage.removeItem('accessToken');
          window.location.href = '/auth/login'; 
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;