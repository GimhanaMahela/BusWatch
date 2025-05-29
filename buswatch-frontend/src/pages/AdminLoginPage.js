import React, { useState, useContext } from "react";
import {
  Typography,
  TextField,
  Button,
  Container,
  Paper,
  CircularProgress,
  Alert,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const LoginContainer = styled(Paper)`
  padding: ${({ theme }) => theme.spacing * 4}px;
  margin-top: ${({ theme }) => theme.spacing * 8}px;
  margin-bottom: ${({ theme }) => theme.spacing * 8}px;
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing * 3}px;
  max-width: 450px;
  margin-left: auto;
  margin-right: auto;
`;

function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { login, isAuthenticated } = useContext(AuthContext);

  // If already authenticated, redirect to dashboard
  if (isAuthenticated) {
    navigate("/admin/dashboard", { replace: true });
    return null; // Or a loading spinner if preferred
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await login(email, password);
      if (result.success) {
        navigate("/admin/dashboard");
      } else {
        setError(result.message || "Invalid credentials");
      }
    } catch (err) {
      setError("An unexpected error occurred during login.");
      console.error("Login error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <LoginContainer elevation={3}>
        <Typography variant="h4" component="h1" align="center" color="primary">
          Admin Login
        </Typography>
        <Typography variant="body1" align="center" color="textSecondary">
          Access the BusWatch administration panel.
        </Typography>

        <form onSubmit={handleSubmit}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <TextField
            fullWidth
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            sx={{ mb: 2 }}
          />
          <TextField
            fullWidth
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            sx={{ mb: 3 }}
          />
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            disabled={loading}
            sx={{ py: 1.5 }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : "Login"}
          </Button>
        </form>
      </LoginContainer>
    </Container>
  );
}

export default AdminLoginPage;
