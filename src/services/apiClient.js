import axios from 'axios';
import API_URL from '../config/api';

const apiClient = axios.create({
  baseURL: API_URL,
});

// Interceptor to attach the auth token to every request if it exists
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default apiClient;
