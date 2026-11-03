"use client";

import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import EmailRoundedIcon from "@mui/icons-material/EmailRounded";
import LockRoundedIcon from "@mui/icons-material/LockRounded";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";
import {
  Alert,
  Box,
  Button,
  IconButton,
  InputAdornment,
  TextField,
  Typography,
} from "@mui/material";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { BrandMark, ColorModeToggle, GradientButton } from "@/components/atoms";
import useAuth from "@/hooks/useAuth";
import busHero from "../../../public/bus-hero.jpg";

// Only follow same-site paths after login (never an absolute URL from the query string)
const safeNext = (value: string | null) =>
  value && value.startsWith("/admin/") && !value.startsWith("//") ? value : "/admin/dashboard";

function AdminLoginView() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isAuthenticated, loading: sessionLoading } = useAuth();
  const next = safeNext(searchParams.get("next"));

  useEffect(() => {
    if (isAuthenticated) router.replace(next);
  }, [isAuthenticated, next, router]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    const result = await login(email, password);
    // On success the effect above navigates once the profile has loaded
    if (!result.success) setError(result.message || "Invalid credentials");
    setSubmitting(false);
  };

  return (
    <Box sx={{ display: "grid", gridTemplateColumns: { md: "1.1fr 1fr" }, minHeight: "100vh" }}>
      <Box sx={{ position: "relative", display: { xs: "none", md: "block" }, overflow: "hidden" }}>
        <Image
          src={busHero}
          alt=""
          fill
          priority
          placeholder="blur"
          sizes="55vw"
          style={{ objectFit: "cover" }}
        />
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(160deg, rgba(22,56,184,0.82) 0%, rgba(11,18,32,0.9) 70%)",
          }}
        />
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            p: 6,
            display: "flex",
            flexDirection: "column",
            color: "common.white",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
            <BrandMark iconOnly />
            <Typography sx={{ fontWeight: 800, fontSize: "1.2rem" }}>BusWatch Console</Typography>
          </Box>
          <Box sx={{ flex: 1 }} />
          <Typography variant="h3" component="p" sx={{ maxWidth: 480 }}>
            Every report, one place. Review, escalate, resolve.
          </Typography>
          <Typography sx={{ mt: 2, opacity: 0.8, maxWidth: 440 }}>
            Spot repeat offenders, keep internal notes and keep passengers informed at every step.
          </Typography>
        </Box>
      </Box>

      <Box sx={{ display: "flex", flexDirection: "column", p: { xs: 2.5, sm: 4 } }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Button
            href="/"
            startIcon={<ArrowBackRoundedIcon />}
            color="inherit"
            sx={{ color: "text.secondary" }}
          >
            Back to site
          </Button>
          <ColorModeToggle />
        </Box>

        <Box
          sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", py: 6 }}
        >
          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{ width: "100%", maxWidth: 400, display: "grid", gap: 2.5 }}
          >
            <Box sx={{ display: { md: "none" } }}>
              <BrandMark />
            </Box>
            <Box>
              <Typography variant="h4" component="h1">
                Welcome back
              </Typography>
              <Typography color="text.secondary" sx={{ mt: 0.5 }}>
                Sign in to the BusWatch admin console.
              </Typography>
            </Box>

            {error && <Alert severity="error">{error}</Alert>}

            <TextField
              fullWidth
              label="Email"
              type="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailRoundedIcon color="action" />
                    </InputAdornment>
                  ),
                },
              }}
            />
            <TextField
              fullWidth
              label="Password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockRoundedIcon color="action" />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        onClick={() => setShowPassword((prev) => !prev)}
                        onMouseDown={(e) => e.preventDefault()}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />
            <GradientButton
              size="large"
              type="submit"
              fullWidth
              loading={submitting || sessionLoading}
            >
              Sign in
            </GradientButton>
            <Typography variant="caption" color="text.secondary" sx={{ textAlign: "center" }}>
              Admin accounts are created by a superadmin.
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

export default AdminLoginView;
