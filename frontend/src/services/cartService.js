import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const cartService = {
  getCart: async () => {
    const response = await axios.get(`${API_URL}/api/cart`, {
      headers: getHeaders()
    });
    return response.data;
  },

  addToCart: async (productId, quantity) => {
    const response = await axios.post(
      `${API_URL}/api/cart/items`,
      { productId, quantity },
      { headers: getHeaders() }
    );
    return response.data;
  },

  updateCartItem: async (itemId, quantity) => {
    const response = await axios.put(
      `${API_URL}/api/cart/items/${itemId}`,
      { quantity },
      { headers: getHeaders() }
    );
    return response.data;
  },

  removeFromCart: async (itemId) => {
    const response = await axios.delete(`${API_URL}/api/cart/items/${itemId}`, {
      headers: getHeaders()
    });
    return response.data;
  },

  clearCart: async () => {
    const response = await axios.delete(`${API_URL}/api/cart`, {
      headers: getHeaders()
    });
    return response.data;
  }
};
