"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useSyncExternalStore, type ReactNode } from "react";
import { errorMessage } from "@/api/apiClient";
import { getAdminProfile, loginAdmin } from "@/api/authApi";
import useIsClient from "@/hooks/useIsClient";
import { tokenStore } from "@/lib/tokenStore";
import { AuthContext } from "./authContext";

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const isClient = useIsClient();
  const token = useSyncExternalStore(tokenStore.subscribe, tokenStore.get, tokenStore.getServer);
  const [loggingIn, setLoggingIn] = useState(false);

  // Profile of the signed-in admin; an invalid or expired token clears itself
  const profile = useQuery({
    queryKey: ["auth", "me", token],
    queryFn: async () => {
      try {
        return await getAdminProfile();
      } catch (error) {
        tokenStore.set(null);
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
      tokenStore.set(receivedToken); // the profile query then loads the admin
      return { success: true };
    } catch (err) {
      return { success: false, message: errorMessage(err, "Login failed") };
    } finally {
      setLoggingIn(false);
    }
  };

  const logout = () => {
    tokenStore.set(null);
    queryClient.clear(); // drop cached admin data
  };

  return (
    <AuthContext.Provider
      value={{
        token,
        isAuthenticated: admin !== null,
        loading: !isClient || loggingIn || (!!token && profile.isPending),
        admin,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
