// src/components/PrivateRoute.js
import React, { useContext } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { CircularProgress, Box, Typography } from "@mui/material";

const PrivateRoute = () => {
  const { isAuthenticated, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <Box
        display="flex"
        flexDirection="column" // Arrange vertically
        justifyContent="center"
        alignItems="center"
        height="100vh" // Take full viewport height
        sx={{ bgcolor: "background.default" }} // Use theme background color
      >
        <CircularProgress size={60} sx={{ color: "primary.main", mb: 3 }} />{" "}
        {/* Larger, primary colored spinner */}
        <Typography variant="h5" color="text.secondary">
          Loading authentication data...
        </Typography>
        <Typography variant="body2" color="text.disabled" sx={{ mt: 1 }}>
          Please wait.
        </Typography>
      </Box>
    );
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/admin/login" replace />;
};

export default PrivateRoute;
