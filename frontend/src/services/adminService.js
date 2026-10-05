import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const getAuthHeaders = (customToken = null) => {
  const token = customToken || localStorage.getItem('token');
  return {
    headers: {
      Authorization: `Bearer ${token}`
    }
  };
};

export const adminService = {
  getAdminMe: async (customToken = null) => {
    const response = await axios.get(`${API_URL}/api/admin/me`, getAuthHeaders(customToken));
    return response.data;
  },

  getDashboardSummary: async (customToken = null) => {
    const response = await axios.get(`${API_URL}/api/admin/dashboard/summary`, getAuthHeaders(customToken));
    return response.data;
  },

  getOrderStatistics: async (customToken = null) => {
    const response = await axios.get(`${API_URL}/api/admin/dashboard/orders`, getAuthHeaders(customToken));
    return response.data;
  },

  getInventoryOverview: async (customToken = null) => {
    const response = await axios.get(`${API_URL}/api/admin/dashboard/inventory`, getAuthHeaders(customToken));
    return response.data;
  },

  getRecentActivity: async (customToken = null) => {
    const response = await axios.get(`${API_URL}/api/admin/dashboard/recent-activity`, getAuthHeaders(customToken));
    return response.data;
  },

  // Phase 4D - Admin Product Management
  getAdminProducts: async (customToken = null) => {
    const response = await axios.get(`${API_URL}/api/admin/products`, getAuthHeaders(customToken));
    return response.data;
  },

  getAdminProductById: async (id, customToken = null) => {
    const response = await axios.get(`${API_URL}/api/admin/products/${id}`, getAuthHeaders(customToken));
    return response.data;
  },

  createProduct: async (productData, customToken = null) => {
    const response = await axios.post(`${API_URL}/api/admin/products`, productData, getAuthHeaders(customToken));
    return response.data;
  },

  updateProduct: async (id, productData, customToken = null) => {
    const response = await axios.put(`${API_URL}/api/admin/products/${id}`, productData, getAuthHeaders(customToken));
    return response.data;
  },

  updateProductStatus: async (id, active, customToken = null) => {
    const response = await axios.patch(`${API_URL}/api/admin/products/${id}/status`, { active }, getAuthHeaders(customToken));
    return response.data;
  },

  deleteProduct: async (id, customToken = null) => {
    const response = await axios.delete(`${API_URL}/api/admin/products/${id}`, getAuthHeaders(customToken));
    return response.data;
  }
};
