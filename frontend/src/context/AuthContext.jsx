import { createContext, useContext, useState, useEffect } from "react";
import api from "../api/axiosInstance";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]         = useState(null);
  const [loading, setLoading]   = useState(true);   // wait for token check

  useEffect(() => {
    const saved = localStorage.getItem("user");
    const token = localStorage.getItem("token");

    if (!saved || !token) {
      setLoading(false);
      return;
    }

    // Verify token is still valid with a lightweight profile call
    api.get("/auth/me")
      .then(() => {
        setUser(JSON.parse(saved));
      })
      .catch(() => {
        // Token expired / invalid — clear everything
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = (userData, token) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}