import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const addressService = {
  getAddresses: async () => {
    const response = await axios.get(`${API_URL}/api/addresses`, {
      headers: getHeaders()
    });
    return response.data;
  },

  addAddress: async (addressData) => {
    const response = await axios.post(
      `${API_URL}/api/addresses`,
      addressData,
      { headers: getHeaders() }
    );
    return response.data;
  },

  updateAddress: async (id, addressData) => {
    const response = await axios.put(
      `${API_URL}/api/addresses/${id}`,
      addressData,
      { headers: getHeaders() }
    );
    return response.data;
  },

  setDefaultAddress: async (id) => {
    const response = await axios.put(
      `${API_URL}/api/addresses/${id}/default`,
      {},
      { headers: getHeaders() }
    );
    return response.data;
  },

  deleteAddress: async (id) => {
    const response = await axios.delete(
      `${API_URL}/api/addresses/${id}`,
      { headers: getHeaders() }
    );
    return response.data;
  }
};
