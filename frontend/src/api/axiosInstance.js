import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5001/api"
});

// attach JWT token automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});
// handle token expiration globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If the token is invalid or expired, clear auth and redirect to homepage
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      // Redirect to homepage instead of /login
      window.location.href = "/";
    }
    return Promise.reject(error);
  }
);

export default api;