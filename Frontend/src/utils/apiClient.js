import axios from 'axios';

const backendBaseUrl = (
  import.meta.env.VITE_BASE_API ||
  import.meta.env.BASE_API ||
  'http://localhost:6000'
).replace(/\/$/, '');

const apiBaseUrl = import.meta.env.DEV
  ? '/api/v1'
  : `${backendBaseUrl}/api/v1`;

const apiClient = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
});

let accessToken = null;

const setAccessToken = (token) => {
  accessToken = token || null;
};

const clearAccessToken = () => {
  accessToken = null;
};

apiClient.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }

  return config;
});

let refreshInFlight = null;

const refreshAccessToken = async () => {
  if (!refreshInFlight) {
    refreshInFlight = axios
      .post(
        import.meta.env.DEV
          ? '/api/v1/users/refresh-token'
          : `${apiBaseUrl}/users/refresh-token`,
        {},
        {
          withCredentials: true,
        }
      )
      .then((response) => {
        setAccessToken(response.data?.accessToken || null);
        return response.data?.accessToken || null;
      })
      .finally(() => {
        refreshInFlight = null;
      });
  }

  return refreshInFlight;
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;
    const isRefreshRequest = originalRequest?.url?.includes('/users/refresh-token');

    if (status === 401 && !originalRequest?._retry && !isRefreshRequest) {
      originalRequest._retry = true;

      try {
        await refreshAccessToken();
        return apiClient(originalRequest);
      } catch (refreshError) {
        clearAccessToken();
        return Promise.reject(
          refreshError.response?.data?.message || 'Session expired. Login again.'
        );
      }
    }

    return Promise.reject(error);
  }
);

export { setAccessToken, clearAccessToken };
export default apiClient;
