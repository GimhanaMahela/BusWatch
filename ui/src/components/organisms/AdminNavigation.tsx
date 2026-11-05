"use client";

import AutoStoriesRoundedIcon from "@mui/icons-material/AutoStoriesRounded";
import BarChartRoundedIcon from "@mui/icons-material/BarChartRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import GroupRoundedIcon from "@mui/icons-material/GroupRounded";
import InboxRoundedIcon from "@mui/icons-material/InboxRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import QrCode2RoundedIcon from "@mui/icons-material/QrCode2Rounded";
import {
  AppBar,
  Avatar,
  Box,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { BrandMark, ColorModeToggle } from "@/components/atoms";
import useAuth from "@/hooks/useAuth";
import ManageAdminsDialog from "./ManageAdminsDialog";

export const SIDEBAR_WIDTH = 264;

const NAV_ITEMS = [
  {
    label: "Reports",
    href: "/admin/dashboard",
    icon: <InboxRoundedIcon />,
    match: ["/admin/dashboard", "/admin/reports"],
  },
  {
    label: "Analytics",
    href: "/admin/analytics",
    icon: <BarChartRoundedIcon />,
    match: ["/admin/analytics"],
  },
  {
    label: "Stories",
    href: "/admin/stories",
    icon: <AutoStoriesRoundedIcon />,
    match: ["/admin/stories"],
  },
  {
    label: "QR stickers",
    href: "/admin/qr-codes",
    icon: <QrCode2RoundedIcon />,
    match: ["/admin/qr-codes"],
  },
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { admin, logout } = useAuth();
  const [adminsOpen, setAdminsOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.replace("/admin/login");
  };

  const item = (key: string, label: string, icon: ReactNode, props: object, selected = false) => (
    <ListItemButton
      key={key}
      selected={selected}
      sx={{
        borderRadius: 2.5,
        mb: 0.5,
        py: 1,
        "&.Mui-selected": {
          color: "primary.main",
          bgcolor: "rgba(var(--mui-palette-primary-mainChannel) / 0.1)",
          "& .MuiListItemIcon-root": { color: "primary.main" },
        },
      }}
      {...props}
    >
      <ListItemIcon sx={{ minWidth: 38 }}>{icon}</ListItemIcon>
      <ListItemText primary={label} slotProps={{ primary: { sx: { fontWeight: 600 } } }} />
    </ListItemButton>
  );

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%", p: 2 }}>
      <Box
        component={Link}
        href="/admin/dashboard"
        sx={{ px: 1, py: 1, mb: 3, display: "flex", textDecoration: "none" }}
      >
        <BrandMark size={34} />
      </Box>

      <Typography variant="overline" color="text.secondary" sx={{ px: 1.5 }}>
        Workspace
      </Typography>
      <List component="nav" aria-label="Admin" onClick={onNavigate}>
        {NAV_ITEMS.map((nav) =>
          item(
            nav.href,
            nav.label,
            nav.icon,
            { component: Link, href: nav.href },
            nav.match.some((m) => pathname.startsWith(m)),
          ),
        )}
        {admin?.role === "superadmin" &&
          item("admins", "Team", <GroupRoundedIcon />, { onClick: () => setAdminsOpen(true) })}
        {item("site", "Public site", <OpenInNewRoundedIcon />, {
          component: Link,
          href: "/",
          target: "_blank",
        })}
      </List>

      <Box sx={{ flex: 1 }} />

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.5,
          p: 1.5,
          borderRadius: 3,
          border: 1,
          borderColor: "divider",
        }}
      >
        <Avatar
          sx={{
            width: 36,
            height: 36,
            bgcolor: "primary.main",
            fontSize: "0.95rem",
            fontWeight: 700,
          }}
        >
          {admin?.email.charAt(0).toUpperCase()}
        </Avatar>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography variant="body2" noWrap sx={{ fontWeight: 700 }}>
            {admin?.email}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ textTransform: "capitalize" }}>
            {admin?.role}
          </Typography>
        </Box>
        <Tooltip title="Sign out">
          <IconButton aria-label="Sign out" onClick={handleLogout} size="small">
            <LogoutRoundedIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      <ManageAdminsDialog open={adminsOpen} onClose={() => setAdminsOpen(false)} />
    </Box>
  );
}

/** Admin console navigation: fixed sidebar on desktop, top bar + drawer on mobile. */
function AdminNavigation() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <AppBar
        position="sticky"
        sx={{
          display: { md: "none" },
          displayPrint: "none",
          borderBottom: 1,
          borderColor: "divider",
          bgcolor: "rgba(var(--mui-palette-background-defaultChannel) / 0.8)",
          backdropFilter: "blur(14px)",
          color: "text.primary",
        }}
      >
        <Toolbar sx={{ gap: 1 }}>
          <IconButton edge="start" aria-label="Open navigation" onClick={() => setOpen(true)}>
            <MenuRoundedIcon />
          </IconButton>
          <BrandMark size={30} />
          <Box sx={{ flex: 1 }} />
          <ColorModeToggle />
        </Toolbar>
      </AppBar>

      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        sx={{ display: { md: "none" } }}
        slotProps={{ paper: { sx: { width: SIDEBAR_WIDTH } } }}
      >
        <IconButton
          aria-label="Close navigation"
          onClick={() => setOpen(false)}
          sx={{ position: "absolute", top: 16, right: 12, zIndex: 1 }}
        >
          <CloseRoundedIcon />
        </IconButton>
        <SidebarContent onNavigate={() => setOpen(false)} />
      </Drawer>

      <Box
        component="aside"
        sx={{
          display: { xs: "none", md: "block" },
          displayPrint: "none",
          width: SIDEBAR_WIDTH,
          flexShrink: 0,
          position: "sticky",
          top: 0,
          height: "100vh",
          borderRight: 1,
          borderColor: "divider",
          bgcolor: "background.paper",
        }}
      >
        <SidebarContent />
        <Box sx={{ position: "absolute", top: 22, right: 16 }}>
          <ColorModeToggle />
        </Box>
      </Box>
    </>
  );
}

export default AdminNavigation;
