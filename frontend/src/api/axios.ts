import axios from "axios";

export const API_BASE_URL =
  (import.meta.env.VITE_API_URL as string) || "http://localhost:5000/api/v1";

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  withCredentials: false,
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    // Standardize error shape
    const message =
      err?.response?.data?.message || err?.message || "Network error";
    return Promise.reject(new Error(message));
  },
);
