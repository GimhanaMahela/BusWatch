import React, { createContext, useState, useEffect, useCallback } from "react";
import axios from "axios";

const AuthContext = createContext();

const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [admin, setAdmin] = useState(null);

  const setAuthToken = useCallback((token) => {
    if (token) {
      axios.defaults.headers.common["x-auth-token"] = token;
      localStorage.setItem("token", token);
    } else {
      delete axios.defaults.headers.common["x-auth-token"];
      localStorage.removeItem("token");
    }
  }, []);

  const loadAdmin = useCallback(async () => {
    if (token) {
      setAuthToken(token); // Ensure token is set before making the request
      try {
        const res = await axios.get("/api/auth"); // Your backend endpoint to get admin details
        setAdmin(res.data);
        setIsAuthenticated(true); // This sets isAuthenticated to true upon successful admin data fetch
      } catch (err) {
        console.error("Error loading admin:", err.message);
        setToken(null);
        setIsAuthenticated(false);
        setAdmin(null);
        localStorage.removeItem("token");
      }
    } else {
      // If there's no token, ensure isAuthenticated is false
      setIsAuthenticated(false);
      setAdmin(null);
    }
    setLoading(false); // Loading is done once admin data is attempted to be loaded
  }, [token, setAuthToken]); // `token` is a dependency here. When token changes, loadAdmin runs.

  useEffect(() => {
    // This effect runs on component mount and when 'token' or 'setAuthToken' changes.
    // When `login` sets a new token, this `useEffect` will trigger `loadAdmin`,
    // which in turn will set `isAuthenticated`.
    loadAdmin();
  }, [loadAdmin]);

  // Login function
  const login = async (email, password) => {
    try {
      setLoading(true); // Start loading at the beginning of the login attempt
      const res = await axios.post("/api/auth/login", { email, password });
      const receivedToken = res.data.token; // Get the token from the response

      setToken(receivedToken); // Update the token state
      setAuthToken(receivedToken); // Store token in localStorage and Axios headers

      // Option 1 (Preferred): Let useEffect handle loadAdmin and setIsAuthenticated
      // The `useEffect` listening to `token` will fire now, which will call `loadAdmin`
      // and eventually set `isAuthenticated` to `true`.
      // The `AdminLoginPage` should wait for this state update.

      // Option 2 (Less ideal but more immediate in some scenarios):
      // Force immediate update. Only use if Option 1 doesn't work after full testing.
      // setIsAuthenticated(true);
      // setAdmin(res.data.user); // If your login response directly returns user data

      setLoading(false); // Stop loading after token is set
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
    setAuthToken(null);
    console.log("Logged out");
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        isAuthenticated,
        loading, // Expose loading state
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
