import apiClient from './apiClient';

export const fetchOptions = async () => {
  const response = await apiClient.get('/api/options');
  return response.data;
};

export const updateOptions = async (options) => {
  const response = await apiClient.post('/api/options', options);
  return response.data;
};
