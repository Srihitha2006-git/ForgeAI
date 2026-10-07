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
  },

  // Phase 4E - Admin Order Management
  getAdminOrders: async (filters = {}, customToken = null) => {
    const params = new URLSearchParams();
    if (filters.search) params.append('search', filters.search.trim());
    if (filters.status && filters.status !== 'ALL') params.append('status', filters.status.trim());

    const queryString = params.toString() ? `?${params.toString()}` : '';
    const response = await axios.get(`${API_URL}/api/admin/orders${queryString}`, getAuthHeaders(customToken));
    return response.data;
  },

  getAdminOrderById: async (orderId, customToken = null) => {
    const response = await axios.get(`${API_URL}/api/admin/orders/${orderId}`, getAuthHeaders(customToken));
    return response.data;
  },

  updateAdminOrderStatus: async (orderId, statusData, customToken = null) => {
    const response = await axios.patch(`${API_URL}/api/admin/orders/${orderId}/status`, statusData, getAuthHeaders(customToken));
    return response.data;
  },

  getAdminOrderHistory: async (orderId, customToken = null) => {
    const response = await axios.get(`${API_URL}/api/admin/orders/${orderId}/history`, getAuthHeaders(customToken));
    return response.data;
  },

  // Phase 4F - Admin Analytics
  getAnalyticsSummary: async (customToken = null) => {
    const response = await axios.get(`${API_URL}/api/admin/analytics/summary`, getAuthHeaders(customToken));
    return response.data;
  },

  getSalesAnalytics: async (customToken = null) => {
    const response = await axios.get(`${API_URL}/api/admin/analytics/sales`, getAuthHeaders(customToken));
    return response.data;
  },

  getOrderStatusAnalytics: async (customToken = null) => {
    const response = await axios.get(`${API_URL}/api/admin/analytics/orders`, getAuthHeaders(customToken));
    return response.data;
  },

  getProductAnalytics: async (customToken = null) => {
    const response = await axios.get(`${API_URL}/api/admin/analytics/products`, getAuthHeaders(customToken));
    return response.data;
  },

  getInventoryAnalytics: async (customToken = null) => {
    const response = await axios.get(`${API_URL}/api/admin/analytics/inventory`, getAuthHeaders(customToken));
    return response.data;
  },

  getCustomerAnalytics: async (customToken = null) => {
    const response = await axios.get(`${API_URL}/api/admin/analytics/customers`, getAuthHeaders(customToken));
    return response.data;
  },

  getSalesTrend: async (customToken = null) => {
    const response = await axios.get(`${API_URL}/api/admin/analytics/sales-trend`, getAuthHeaders(customToken));
    return response.data;
  },

  getTopProducts: async (customToken = null) => {
    const response = await axios.get(`${API_URL}/api/admin/analytics/top-products`, getAuthHeaders(customToken));
    return response.data;
  }
};
