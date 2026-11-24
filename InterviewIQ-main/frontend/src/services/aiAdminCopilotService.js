const API_URL = 'http://localhost:5000/api/ai-admin-copilot';

const getAuthToken = () => {
  return localStorage.getItem('token') || localStorage.getItem('accessToken');
};

export const askAdminCopilot = async (question) => {
  const token = getAuthToken();

  const response = await fetch(`${API_URL}/ask`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    body: JSON.stringify({ question }),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || 'Failed to get response from Admin Copilot');
  }

  return result.data;
};

export default {
  askAdminCopilot,
};