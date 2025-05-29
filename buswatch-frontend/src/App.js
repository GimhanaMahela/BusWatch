import React from "react";
import { Routes, Route } from "react-router-dom";
import { CssBaseline } from "@mui/material"; // Resets CSS for consistent styling
import Header from "./components/Header";
import Footer from "./components/Footer";
import ReportDetailsPage from "./pages/ReportDetailsPage";
import PrivateRoute from "./components/PrivateRoute"; // For protected routes
import HomePage from "./pages/HomePage";
import SubmitReportPage from "./pages/SubmitReportPage";
import AdminLoginPage from "./pages/AdminLoginPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";

function App() {
  return (
    <>
      <CssBaseline /> {/* Apply global CSS reset */}
      <Header />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/submit-report" element={<SubmitReportPage />} />
        <Route path="/admin/login" element={<AdminLoginPage />} />
        {/* Protected Admin Routes */}
        <Route element={<PrivateRoute />}>
          <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
          <Route path="/admin/reports/:id" element={<ReportDetailsPage />} />
        </Route>
      </Routes>
      <Footer />
    </>
  );
}

export default App;
