import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import { LoadingState } from "../components/molecules";

/** Renders child routes only for a signed-in admin; otherwise redirects to login. */
const PrivateRoute = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <LoadingState
        message="Loading authentication data..."
        hint="Please wait."
        minHeight="100vh"
      />
    );
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/admin/login" replace />;
};

export default PrivateRoute;
