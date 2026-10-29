import React, { useEffect, useState, useCallback } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Box,
  Typography,
  Alert,
  List,
  ListItem,
  ListItemText,
  Chip,
  CircularProgress,
} from "@mui/material";
import { listAdmins, createAdmin } from "../../api/authApi";

const EMPTY = { email: "", password: "", role: "admin" };

function ManageAdminsDialog({ open, onClose }) {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setAdmins(await listAdmins());
    } catch (err) {
      setError(err.message || "Failed to load admins");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      setError("");
      setSuccess("");
      load();
    }
  }, [open, load]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const { admin } = await createAdmin(form.email, form.password, form.role);
      setSuccess(`Created ${admin.email}. Share the password with them securely.`);
      setForm(EMPTY);
      load();
    } catch (err) {
      setError(err.message || "Failed to create admin");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontWeight: 700 }}>Manage Admins</DialogTitle>
      <DialogContent dividers>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
            <CircularProgress size={28} />
          </Box>
        ) : (
          <List dense sx={{ mb: 2 }}>
            {admins.map((a) => (
              <ListItem key={a._id} disableGutters>
                <ListItemText
                  primary={a.email}
                  secondary={a.createdAt ? `Added ${new Date(a.createdAt).toLocaleDateString()}` : null}
                />
                <Chip
                  size="small"
                  label={a.role}
                  color={a.role === "superadmin" ? "primary" : "default"}
                />
              </ListItem>
            ))}
          </List>
        )}

        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
          Add an admin
        </Typography>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
        <Box component="form" id="create-admin-form" onSubmit={handleCreate}
          sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <TextField
            label="Email"
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <TextField
            label="Temporary password"
            type="password"
            required
            helperText="At least 8 characters"
            inputProps={{ minLength: 8 }}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          <TextField
            select
            label="Role"
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
            helperText="Superadmins can also add other admins"
          >
            <MenuItem value="admin">Admin</MenuItem>
            <MenuItem value="superadmin">Superadmin</MenuItem>
          </TextField>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
        <Button type="submit" form="create-admin-form" variant="contained" disabled={saving}>
          {saving ? <CircularProgress size={20} color="inherit" /> : "Add admin"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default ManageAdminsDialog;
