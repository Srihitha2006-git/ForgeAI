import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
};

export const chatService = {
  /**
   * Send a message to the ForgeAI chatbot endpoint.
   * @param {string} message - User message text
   * @param {string|null} conversationId - Optional session ID
   * @returns {Promise<{reply: string, conversationId: string}>}
   */
  sendMessage: async (message, conversationId = null) => {
    const payload = { message };
    if (conversationId) {
      payload.conversationId = conversationId;
    }

    const response = await axios.post(
      `${API_URL}/api/chat`,
      payload,
      { headers: getHeaders() }
    );
    return response.data;
  }
};
