import axios from "axios";

const api = axios.create({
  baseURL: "https://urbanride-qg4a.onrender.com/api"
});

// attach JWT token automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default api;