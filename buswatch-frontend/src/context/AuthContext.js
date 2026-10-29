import React, { createContext, useState, useEffect, useCallback } from "react";
import { loginAdmin, getAdminProfile } from "../api/authApi";

const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [admin, setAdmin] = useState(null);

  // The API client reads the token from localStorage on every request
  const setAuthToken = useCallback((newToken) => {
    if (newToken) {
      localStorage.setItem("token", newToken);
    } else {
      localStorage.removeItem("token");
    }
  }, []);

  const loadAdmin = useCallback(async () => {
    if (token) {
      setAuthToken(token);
      try {
        const profile = await getAdminProfile();
        setAdmin(profile);
        setIsAuthenticated(true);
      } catch (err) {
        console.error("Error loading admin:", err.message);
        setToken(null);
        setIsAuthenticated(false);
        setAdmin(null);
        setAuthToken(null);
      }
    } else {
      setIsAuthenticated(false);
      setAdmin(null);
    }
    setLoading(false);
  }, [token, setAuthToken]);

  // Runs on mount and whenever the token changes (e.g. after login)
  useEffect(() => {
    loadAdmin();
  }, [loadAdmin]);

  const login = async (email, password) => {
    try {
      setLoading(true);
      const { token: receivedToken } = await loginAdmin(email, password);
      setAuthToken(receivedToken);
      setToken(receivedToken); // triggers loadAdmin, which sets isAuthenticated
      return { success: true };
    } catch (err) {
      console.error("Login failed:", err.message);
      setToken(null);
      setIsAuthenticated(false);
      setAdmin(null);
      setLoading(false);
      return { success: false, message: err.message || "Login failed" };
    }
  };

  const logout = () => {
    setToken(null);
    setIsAuthenticated(false);
    setAdmin(null);
    setAuthToken(null);
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        isAuthenticated,
        loading,
        admin,
        login,
        logout,
        setAuthToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext, AuthProvider };
