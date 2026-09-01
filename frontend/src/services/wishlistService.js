import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const wishlistService = {
  getWishlist: async () => {
    const response = await axios.get(`${API_URL}/api/wishlist`, {
      headers: getHeaders()
    });
    return response.data;
  },

  addToWishlist: async (productId) => {
    const response = await axios.post(
      `${API_URL}/api/wishlist/items`,
      { productId },
      { headers: getHeaders() }
    );
    return response.data;
  },

  removeFromWishlist: async (itemId) => {
    const response = await axios.delete(`${API_URL}/api/wishlist/items/${itemId}`, {
      headers: getHeaders()
    });
    return response.data;
  },

  clearWishlist: async () => {
    const response = await axios.delete(`${API_URL}/api/wishlist`, {
      headers: getHeaders()
    });
    return response.data;
  }
};
