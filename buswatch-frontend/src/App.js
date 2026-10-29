import React from "react";
import { Routes, Route } from "react-router-dom";
import { CssBaseline } from "@mui/material"; // Resets CSS for consistent styling
import { MainLayout } from "./components/templates";
import PrivateRoute from "./routes/PrivateRoute";

// Public pages
import HomePage from "./pages/public/HomePage";
import AboutUsPage from "./pages/public/AboutUsPage";
import SubmitReportPage from "./pages/public/SubmitReportPage";
import TrackReportPage from "./pages/public/TrackReportPage";
import PrivacyPolicyPage from "./pages/public/PrivacyPolicyPage";
import TermsOfServicePage from "./pages/public/TermsOfServicePage";

// Admin pages
import AdminLoginPage from "./pages/admin/AdminLoginPage";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage";
import ReportDetailsPage from "./pages/admin/ReportDetailsPage";
import AnalyticsPage from "./pages/admin/AnalyticsPage";

function App() {
  return (
    <>
      <CssBaseline />
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/about-us" element={<AboutUsPage />} />
          <Route path="/submit-report" element={<SubmitReportPage />} />
          <Route path="/track" element={<TrackReportPage />} />
          <Route path="/track/:receiptId" element={<TrackReportPage />} />
          <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
          <Route path="/terms-of-service" element={<TermsOfServicePage />} />
          <Route path="/admin/login" element={<AdminLoginPage />} />

          {/* Protected admin routes */}
          <Route element={<PrivateRoute />}>
            <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
            <Route path="/admin/reports/:id" element={<ReportDetailsPage />} />
            <Route path="/admin/analytics" element={<AnalyticsPage />} />
          </Route>
        </Route>
      </Routes>
    </>
  );
}

export default App;
