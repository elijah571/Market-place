import axios from 'axios';

const ensureApiBase = (value = '') => {
  const normalized = String(value || '').replace(/\/$/, '');

  if (!normalized) {
    return '/api/v1';
  }

  return normalized.endsWith('/api/v1') ? normalized : `${normalized}/api/v1`;
};

const configuredBaseUrl = ensureApiBase(
  import.meta.env.VITE_API_BASE_URL ||
    import.meta.env.VITE_BASE_API ||
    import.meta.env.BASE_API ||
    ''
);

const apiBaseUrl = import.meta.env.DEV
  ? '/api/v1'
  : configuredBaseUrl;

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
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export { setAccessToken, clearAccessToken };
export default apiClient;
