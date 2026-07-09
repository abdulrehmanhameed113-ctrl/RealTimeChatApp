import axios from "axios";

export const axiosInstance = axios.create({
  baseURL: "http://localhost:5000/api",
  withCredentials: true,
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Check if token has expired and retry has not been initiated yet
    if (
      error.response?.status === 401 &&
      error.response?.data?.code === "TOKEN_EXPIRED" &&
      !originalRequest._retry
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return axiosInstance(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const localRefreshToken = localStorage.getItem("refreshToken");
        const res = await axios.post(
          "http://localhost:5000/api/auth/refresh",
          { refreshToken: localRefreshToken },
          { withCredentials: true }
        );

        const { token, refreshToken: newRefreshToken } = res.data;

        localStorage.setItem("token", token);
        if (newRefreshToken) {
          localStorage.setItem("refreshToken", newRefreshToken);
        }

        axiosInstance.defaults.headers.common["Authorization"] = `Bearer ${token}`;
        originalRequest.headers.Authorization = `Bearer ${token}`;

        processQueue(null, token);
        isRefreshing = false;

        return axiosInstance(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        isRefreshing = false;

        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");

        // Force redirect to login page if we are not already on it
        if (
          window.location.pathname !== "/login" &&
          window.location.pathname !== "/signup"
        ) {
          window.location.href = "/login";
        }

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);