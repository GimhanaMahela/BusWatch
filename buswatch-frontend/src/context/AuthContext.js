import React, { createContext, useState, useEffect, useCallback } from "react";
import axios from "axios";

const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [admin, setAdmin] = useState(null);

  // Set default headers for Axios
  const setAuthToken = useCallback((token) => {
    if (token) {
      axios.defaults.headers.common["x-auth-token"] = token;
      localStorage.setItem("token", token);
    } else {
      delete axios.defaults.headers.common["x-auth-token"];
      localStorage.removeItem("token");
    }
  }, []);

  // Load admin details if token exists
  const loadAdmin = useCallback(async () => {
    if (token) {
      setAuthToken(token);
      try {
        const res = await axios.get("/api/auth"); 
        setAdmin(res.data);
        setIsAuthenticated(true);
      } catch (err) {
        console.error("Error loading admin:", err.message);
        setToken(null);
        setIsAuthenticated(false);
        setAdmin(null);
        localStorage.removeItem("token");
      }
    } else {
      setIsAuthenticated(false);
      setAdmin(null);
    }
    setLoading(false);
  }, [token, setAuthToken]);

  useEffect(() => {
    loadAdmin();
  }, [loadAdmin]);

  // Login function
  const login = async (email, password) => {
    try {
      setLoading(true);
      // Change from `${API_URL}/auth/login` to just `/api/auth/login`
      const res = await axios.post("/api/auth/login", { email, password });
      setToken(res.data.token);
      setAuthToken(res.data.token);
      await loadAdmin();
      return { success: true };
    } catch (err) {
      console.error("Login failed:", err.response?.data?.msg || err.message);
      setToken(null);
      setIsAuthenticated(false);
      setAdmin(null);
      setLoading(false);
      return {
        success: false,
        message: err.response?.data?.msg || "Login failed",
      };
    }
  };

  // Logout function
  const logout = () => {
    setToken(null);
    setIsAuthenticated(false);
    setAdmin(null);
    setAuthToken(null); // Clear the token from localStorage and Axios headers
    console.log("Logged out");
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
        setAuthToken, // Expose for initial setup if needed elsewhere
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext, AuthProvider };
