import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const orderService = {
  getOrders: async () => {
    const response = await axios.get(
      `${API_URL}/api/orders`,
      { headers: getHeaders() }
    );
    return response.data;
  },

  getOrderDetails: async (orderId) => {
    const response = await axios.get(
      `${API_URL}/api/orders/${orderId}`,
      { headers: getHeaders() }
    );
    return response.data;
  },

  getOrderTracking: async (orderId) => {
    const response = await axios.get(
      `${API_URL}/api/orders/${orderId}/tracking`,
      { headers: getHeaders() }
    );
    return response.data;
  }
};
