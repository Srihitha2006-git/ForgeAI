import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const paymentService = {
  createOrder: async (addressId) => {
    const response = await axios.post(
      `${API_URL}/api/payments/create-order`,
      { addressId },
      { headers: getHeaders() }
    );
    return response.data;
  },

  verifyPayment: async (verificationData) => {
    const response = await axios.post(
      `${API_URL}/api/payments/verify`,
      verificationData,
      { headers: getHeaders() }
    );
    return response.data;
  }
};
