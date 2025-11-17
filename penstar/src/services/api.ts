import axios from "axios";
import { message } from "antd";

export const instance = axios.create({
  baseURL: import.meta.env.VITE_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach Authorization header from localStorage token
instance.interceptors.request.use(
  (config) => {
    try {
      const token = localStorage.getItem("penstar_token");
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // ignore reading localStorage errors
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle 401 globally: clear token, show message and redirect to sign-in
instance.interceptors.response.use(
  (res) => res,
  (err) => {
    const status = err?.response?.status;
    if (status === 401) {
      try {
        localStorage.removeItem("penstar_token");
      } catch {
        // ignore
      }
      message.error("Unauthorized — vui lòng đăng nhập lại");
      // Nếu đang ở trang booking success thì không redirect
      if (!window.location.pathname.includes("/bookings/success")) {
        window.location.href = "/signin";
      }
    }
    return Promise.reject(err);
  }
);

export default instance;
