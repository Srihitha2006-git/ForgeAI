import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const checkoutService = {
  validateCheckout: async (addressId) => {
    const response = await axios.post(
      `${API_URL}/api/checkout/validate`,
      { addressId },
      { headers: getHeaders() }
    );
    return response.data;
  }
};
