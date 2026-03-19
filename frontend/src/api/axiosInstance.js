import axios from "axios";

// Ensure the base URL always ends with /api regardless of how the env var is set
const rawBase = import.meta.env.VITE_API_URL || "http://localhost:5001/api";
const baseURL = rawBase.endsWith("/api") ? rawBase : `${rawBase.replace(/\/$/, "")}/api`;

const api = axios.create({ baseURL });

// attach JWT token automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default api;