import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { errorMessage } from "../api/apiClient";
import { getAdminProfile, loginAdmin } from "../api/authApi";
import { AuthContext } from "./authContext";

// The API client reads the token from localStorage on every request
const storeToken = (token: string | null) => {
  if (token) localStorage.setItem("token", token);
  else localStorage.removeItem("token");
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("token"));
  const [loggingIn, setLoggingIn] = useState(false);

  // Profile of the signed-in admin; an invalid or expired token clears itself
  const profile = useQuery({
    queryKey: ["auth", "me", token],
    queryFn: async () => {
      try {
        return await getAdminProfile();
      } catch (error) {
        storeToken(null);
        throw error;
      }
    },
    enabled: !!token,
    retry: false,
    staleTime: Infinity,
  });

  const admin = token && profile.data ? profile.data : null;

  const login = async (email: string, password: string) => {
    setLoggingIn(true);
    try {
      const { token: receivedToken } = await loginAdmin(email, password);
      storeToken(receivedToken);
      setToken(receivedToken); // the profile query then loads the admin
      return { success: true };
    } catch (err) {
      return { success: false, message: errorMessage(err, "Login failed") };
    } finally {
      setLoggingIn(false);
    }
  };

  const logout = () => {
    storeToken(null);
    setToken(null);
    queryClient.clear(); // drop cached admin data
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        isAuthenticated: admin !== null,
        loading: loggingIn || (!!token && profile.isPending),
        admin,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
