import { CssBaseline } from "@mui/material";
import { lazy } from "react";
import { Route, Routes } from "react-router";
import { MainLayout } from "./components/templates";
import HomePage from "./pages/public/HomePage";
import PrivateRoute from "./routes/PrivateRoute";

// Route-level code splitting: each page loads only when it is first visited
const AboutUsPage = lazy(() => import("./pages/public/AboutUsPage"));
const SubmitReportPage = lazy(() => import("./pages/public/SubmitReportPage"));
const TrackReportPage = lazy(() => import("./pages/public/TrackReportPage"));
const PrivacyPolicyPage = lazy(() => import("./pages/public/PrivacyPolicyPage"));
const TermsOfServicePage = lazy(() => import("./pages/public/TermsOfServicePage"));
const AdminLoginPage = lazy(() => import("./pages/admin/AdminLoginPage"));
const AdminDashboardPage = lazy(() => import("./pages/admin/AdminDashboardPage"));
const ReportDetailsPage = lazy(() => import("./pages/admin/ReportDetailsPage"));
const AnalyticsPage = lazy(() => import("./pages/admin/AnalyticsPage"));

function App() {
  return (
    <>
      <CssBaseline />
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/about-us" element={<AboutUsPage />} />
          <Route path="/submit-report" element={<SubmitReportPage />} />
          <Route path="/track/:receiptId?" element={<TrackReportPage />} />
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
