import { useState, type FormEvent } from "react";
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
import { errorMessage } from "../../api/apiClient";
import { useAdmins, useCreateAdmin } from "../../hooks/useReportQueries";
import type { AdminRole } from "../../types/admin";

interface ManageAdminsDialogProps {
  open: boolean;
  onClose: () => void;
}

const EMPTY: { email: string; password: string; role: AdminRole } = {
  email: "",
  password: "",
  role: "admin",
};

function ManageAdminsDialog({ open, onClose }: ManageAdminsDialogProps) {
  const adminsQuery = useAdmins(open);
  const createMutation = useCreateAdmin();
  const [form, setForm] = useState(EMPTY);
  const [success, setSuccess] = useState("");

  const admins = adminsQuery.data ?? [];
  const loading = adminsQuery.isPending && open;
  const saving = createMutation.isPending;
  const error = adminsQuery.error
    ? errorMessage(adminsQuery.error, "Failed to load admins")
    : createMutation.error
      ? errorMessage(createMutation.error, "Failed to create admin")
      : "";

  const handleClose = () => {
    setSuccess("");
    createMutation.reset();
    onClose();
  };

  const handleCreate = (e: FormEvent) => {
    e.preventDefault();
    setSuccess("");
    createMutation.mutate(form, {
      onSuccess: ({ admin }) => {
        setSuccess(`Created ${admin.email}. Share the password with them securely.`);
        setForm(EMPTY);
      },
    });
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontWeight: 700 }}>Manage Admins</DialogTitle>
      <DialogContent dividers>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
            <CircularProgress size={28} />
          </Box>
        ) : (
          <List dense sx={{ mb: 2 }}>
            {admins.map((a) => (
              <ListItem key={a.id} disableGutters>
                <ListItemText
                  primary={a.email}
                  secondary={
                    a.createdAt ? `Added ${new Date(a.createdAt).toLocaleDateString()}` : null
                  }
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
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}
        <Box
          component="form"
          id="create-admin-form"
          onSubmit={handleCreate}
          sx={{ display: "flex", flexDirection: "column", gap: 2 }}
        >
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

            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            slotProps={{ htmlInput: { minLength: 8 } }}
          />
          <TextField
            select
            label="Role"
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value as AdminRole })}
            helperText="Superadmins can also add other admins"
          >
            <MenuItem value="admin">Admin</MenuItem>
            <MenuItem value="superadmin">Superadmin</MenuItem>
          </TextField>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Close</Button>
        <Button type="submit" form="create-admin-form" variant="contained" disabled={saving}>
          {saving ? <CircularProgress size={20} color="inherit" /> : "Add admin"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default ManageAdminsDialog;
