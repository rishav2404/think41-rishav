import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const chatApi = {
  sendMessage: async (message, userId = 'user', conversationId) => {
    const response = await api.post('/api/chat', {
      message,
      user_id: userId,
      conversation_id: conversationId,
    });
    return response.data;
  },

  getConversations: async (userId) => {
    const response = await api.get(`/api/conversations/${userId}`);
    return response.data;
  },

  getConversationMessages: async (conversationId) => {
    const response = await api.get(`/api/conversations/${conversationId}/messages`);
    return response.data;
  },

  deleteConversation: async (conversationId) => {
    await api.delete(`/api/conversations/${conversationId}`);
  },

  createConversation: async (userId, title) => {
    const response = await api.post('/api/conversations', {
      user_id: userId,
      title,
    });
    return response.data;
  },

  getProducts: async () => {
    const response = await api.get('/api/products');
    return response.data;
  },

  healthCheck: async () => {
    const response = await api.get('/api/health');
    return response.data;
  },
};
