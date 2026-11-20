"use client";

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
import { errorMessage } from "@/api/apiClient";
import { useAdmins, useCreateAdmin, useUpdateOperatorFleet } from "@/hooks/useReportQueries";
import type { Admin, AdminRole } from "@/types/admin";

interface ManageAdminsDialogProps {
  open: boolean;
  onClose: () => void;
}

const EMPTY = {
  email: "",
  password: "",
  role: "admin" as AdminRole,
  organisation: "",
  buses: "",
};

/** Bus numbers typed one per line or separated by commas. */
const parseBuses = (text: string) =>
  text
    .split(/[\n,]+/)
    .map((bus) => bus.trim())
    .filter(Boolean);

const ROLE_COLOURS: Record<AdminRole, "primary" | "default" | "secondary"> = {
  superadmin: "primary",
  admin: "default",
  operator: "secondary",
};

/** Edits one operator's name and buses in place. */
function FleetEditor({ operator, onDone }: { operator: Admin; onDone: () => void }) {
  const update = useUpdateOperatorFleet();
  const [organisation, setOrganisation] = useState(operator.organisation ?? "");
  const [buses, setBuses] = useState((operator.fleet ?? []).join("\n"));

  const save = (e: FormEvent) => {
    e.preventDefault();
    update.mutate(
      { id: operator.id, busNumbers: parseBuses(buses), organisation },
      { onSuccess: onDone },
    );
  };

  return (
    <Box component="form" onSubmit={save} sx={{ display: "grid", gap: 1.5, width: "100%", py: 1 }}>
      {update.error && (
        <Alert severity="error">{errorMessage(update.error, "Could not save the buses")}</Alert>
      )}
      <TextField
        size="small"
        label="Company or owner name"
        required
        value={organisation}
        onChange={(e) => setOrganisation(e.target.value)}
      />
      <TextField
        size="small"
        label="Bus numbers"
        multiline
        minRows={3}
        value={buses}
        onChange={(e) => setBuses(e.target.value)}
        helperText="One per line or separated by commas. Spaces and dashes don't matter."
      />
      <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
        <Button size="small" onClick={onDone}>
          Cancel
        </Button>
        <Button size="small" type="submit" variant="contained" disabled={update.isPending}>
          Save buses
        </Button>
      </Box>
    </Box>
  );
}

function ManageAdminsDialog({ open, onClose }: ManageAdminsDialogProps) {
  const adminsQuery = useAdmins(open);
  const createMutation = useCreateAdmin();
  const [form, setForm] = useState(EMPTY);
  const [success, setSuccess] = useState("");
  const [editing, setEditing] = useState<string | null>(null);

  const admins = adminsQuery.data ?? [];
  const loading = adminsQuery.isPending && open;
  const saving = createMutation.isPending;
  const operator = form.role === "operator";
  const error = adminsQuery.error
    ? errorMessage(adminsQuery.error, "Failed to load accounts")
    : createMutation.error
      ? errorMessage(createMutation.error, "Failed to create the account")
      : "";

  const handleClose = () => {
    setSuccess("");
    setEditing(null);
    createMutation.reset();
    onClose();
  };

  const handleCreate = (e: FormEvent) => {
    e.preventDefault();
    setSuccess("");
    createMutation.mutate(
      {
        email: form.email,
        password: form.password,
        role: form.role,
        ...(operator
          ? { organisation: form.organisation, busNumbers: parseBuses(form.buses) }
          : {}),
      },
      {
        onSuccess: ({ admin }) => {
          setSuccess(
            `Created ${admin.email}. Share the password with them securely.` +
              (admin.role === "operator" ? " They sign in on the admin login page." : ""),
          );
          setForm(EMPTY);
        },
      },
    );
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontWeight: 700 }}>Manage accounts</DialogTitle>
      <DialogContent dividers>
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
            <CircularProgress size={28} />
          </Box>
        ) : (
          <List dense sx={{ mb: 2 }}>
            {admins.map((a) => (
              <ListItem
                key={a.id}
                disableGutters
                sx={{ flexWrap: "wrap", borderBottom: 1, borderColor: "divider" }}
              >
                <ListItemText
                  primary={
                    a.role === "operator" ? `${a.organisation ?? "Operator"} · ${a.email}` : a.email
                  }
                  secondary={
                    a.role === "operator"
                      ? `${a.fleet?.length ?? 0} bus${a.fleet?.length === 1 ? "" : "es"}${
                          a.fleet?.length
                            ? `: ${a.fleet.slice(0, 6).join(", ")}${a.fleet.length > 6 ? "…" : ""}`
                            : ""
                        }`
                      : a.createdAt
                        ? `Added ${new Date(a.createdAt).toLocaleDateString()}`
                        : null
                  }
                />
                {a.role === "operator" && editing !== a.id && (
                  <Button size="small" onClick={() => setEditing(a.id)} sx={{ mr: 1 }}>
                    Edit buses
                  </Button>
                )}
                <Chip size="small" label={a.role} color={ROLE_COLOURS[a.role]} />
                {editing === a.id && <FleetEditor operator={a} onDone={() => setEditing(null)} />}
              </ListItem>
            ))}
          </List>
        )}

        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
          Add an account
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
            select
            label="Role"
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value as AdminRole })}
            helperText={
              operator
                ? "A bus owner or company. They only see checked reports about their own buses, never passenger details."
                : "Superadmins can also add accounts and manage operators."
            }
          >
            <MenuItem value="admin">Admin</MenuItem>
            <MenuItem value="superadmin">Superadmin</MenuItem>
            <MenuItem value="operator">Bus operator</MenuItem>
          </TextField>
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
          {operator && (
            <>
              <TextField
                label="Company or owner name"
                required
                value={form.organisation}
                onChange={(e) => setForm({ ...form, organisation: e.target.value })}
                helperText="Passengers see this next to the operator's responses."
              />
              <TextField
                label="Bus numbers"
                multiline
                minRows={3}
                value={form.buses}
                onChange={(e) => setForm({ ...form, buses: e.target.value })}
                helperText="One per line or separated by commas, e.g. NB-1234."
              />
            </>
          )}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Close</Button>
        <Button type="submit" form="create-admin-form" variant="contained" disabled={saving}>
          {saving ? (
            <CircularProgress size={20} color="inherit" />
          ) : operator ? (
            "Add operator"
          ) : (
            "Add admin"
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default ManageAdminsDialog;
