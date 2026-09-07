import apiClient from './apiClient';

export const fetchCentres = async () => {
  const response = await apiClient.get('/api/centres');
  return response.data;
};

export const fetchPublicCentres = async () => {
  const response = await apiClient.get('/api/centres/public');
  return response.data;
};

export const addCentre = async (name) => {
  const response = await apiClient.post('/api/centres', { name });
  return response.data;
};

export const deleteCentre = async (id) => {
  const response = await apiClient.delete(`/api/centres/${id}`);
  return response.data;
};
