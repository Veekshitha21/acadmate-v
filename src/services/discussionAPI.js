// src/services/discussionAPI.js
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Helper to get auth token from localStorage
const getAuthToken = () => {
  try {
    const token = localStorage.getItem('token');
    return token;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

// Helper for API calls
const apiCall = async (endpoint, options = {}) => {
  const token = getAuthToken();
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'API request failed');
  }

  return data;
};

// Discussion API
export const discussionAPI = {
  // Get all discussions
  getAll: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return await apiCall(`/discussions?${query}`);
  },

  // Get single discussion
  getById: async (id) => {
    return await apiCall(`/discussions/${id}`);
  },

  // Create discussion
  create: async (data) => {
    return await apiCall('/discussions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Update discussion
  update: async (id, data) => {
    return await apiCall(`/discussions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  // Delete discussion
  delete: async (id) => {
    return await apiCall(`/discussions/${id}`, {
      method: 'DELETE',
    });
  },

  // Vote on discussion
  vote: async (id) => {
    return await apiCall(`/discussions/${id}/vote`, {
      method: 'POST',
    });
  },

  // Check vote status
  getVoteStatus: async (id) => {
    return await apiCall(`/discussions/${id}/vote-status`);
  },
};

// Comment API
export const commentAPI = {
  // Get comments for discussion
  getByDiscussion: async (discussionId) => {
    return await apiCall(`/comments/discussion/${discussionId}`);
  },

  // Create comment
  create: async (data) => {
    return await apiCall('/comments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  // Update comment
  update: async (id, content) => {
    return await apiCall(`/comments/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ content }),
    });
  },

  // Delete comment
  delete: async (id) => {
    return await apiCall(`/comments/${id}`, {
      method: 'DELETE',
    });
  },
};