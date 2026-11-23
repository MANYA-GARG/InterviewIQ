import axios from 'axios';

const API_URL = 'http://localhost:5000/api/platform-settings';

const getAuthConfig = () => {
  const token =
    localStorage.getItem('token') ||
    localStorage.getItem('accessToken');

  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

const getSettings = async () => {
  const response = await axios.get(API_URL, getAuthConfig());
  return response.data;
};

const updateSettings = async (settings) => {
  const response = await axios.patch(
    API_URL,
    settings,
    getAuthConfig()
  );

  return response.data;
};

const platformSettingsService = {
  getSettings,
  updateSettings,
};

export default platformSettingsService;