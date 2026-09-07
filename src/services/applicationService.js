import apiClient from './apiClient';

export const fetchApplications = async () => {
  const response = await apiClient.get('/api/applications');
  return response.data;
};

export const fetchApplicationById = async (id) => {
  const response = await apiClient.get(`/api/applications/${id}`);
  return response.data;
};

export const updateApplicationStatus = async (id, status, missingDocuments) => {
  const response = await apiClient.put(`/api/applications/${id}/status`, { status, missingDocuments });
  return response.data;
};

export const deleteApplication = async (id) => {
  const response = await apiClient.delete(`/api/applications/${id}`);
  return response.data;
};

export const submitApplication = async (formData) => {
  const response = await apiClient.post('/api/applications', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};

export const uploadDocuments = async (id, formData) => {
  const response = await apiClient.post(`/api/applications/${id}/documents`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response.data;
};
