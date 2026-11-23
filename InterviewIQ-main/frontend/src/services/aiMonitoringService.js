const API_URL = 'http://localhost:5000/api/ai-monitoring';

const getAuthToken = () => {
  return localStorage.getItem('token') || localStorage.getItem('accessToken');
};

export const getAIMonitoringData = async (days = 30) => {
  const token = getAuthToken();

  const response = await fetch(`${API_URL}?days=${days}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.message || 'Failed to fetch AI monitoring data');
  }

  return result.data;
};

export default {
  getAIMonitoringData,
};