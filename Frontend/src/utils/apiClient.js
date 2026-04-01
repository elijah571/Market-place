import axios from 'axios';

const apiClient = axios.create({
  baseURL: '/api/v1',
  withCredentials: true,
});

const setAccessToken = () => {};
const clearAccessToken = () => {};

let refreshInFlight = null;

const refreshAccessToken = async () => {
  if (!refreshInFlight) {
    refreshInFlight = axios
      .post(
        '/api/v1/users/refresh-token',
        {},
        {
          withCredentials: true,
        }
      )
      .then(() => null)
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
