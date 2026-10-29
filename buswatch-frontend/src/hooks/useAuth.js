import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

/** Current admin session: { admin, isAuthenticated, loading, login, logout, ... } */
export default function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return context;
}
