"use client";

import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import {
  AppBar,
  Box,
  Button,
  Container,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemText,
  Toolbar,
} from "@mui/material";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { BrandMark, ColorModeToggle, GradientButton } from "@/components/atoms";

const NAV_ITEMS = [
  { label: "Home", href: "/" },
  { label: "Track a report", href: "/track" },
  { label: "About", href: "/about-us" },
];

const isActive = (pathname: string, href: string) =>
  href === "/" ? pathname === "/" : pathname.startsWith(href);

/** Sticky, translucent top bar for the public site. */
function SiteHeader() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <AppBar
      position="sticky"
      sx={{
        top: 0,
        borderBottom: 1,
        borderColor: "divider",
        bgcolor: "rgba(var(--mui-palette-background-defaultChannel) / 0.72)",
        backdropFilter: "saturate(180%) blur(14px)",
        color: "text.primary",
      }}
    >
      <Container maxWidth="lg">
        <Toolbar disableGutters sx={{ gap: 2, minHeight: { xs: 64, md: 72 } }}>
          <Box
            component={Link}
            href="/"
            aria-label="BusWatch home"
            sx={{ display: "flex", textDecoration: "none" }}
          >
            <BrandMark />
          </Box>

          <Box
            component="nav"
            aria-label="Main"
            sx={{ display: { xs: "none", md: "flex" }, gap: 0.5, ml: 4 }}
          >
            {NAV_ITEMS.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <Button
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  sx={{
                    color: active ? "text.primary" : "text.secondary",
                    fontWeight: active ? 700 : 600,
                    bgcolor: active ? "action.selected" : "transparent",
                    "&:hover": { color: "text.primary", bgcolor: "action.hover" },
                  }}
                >
                  {item.label}
                </Button>
              );
            })}
          </Box>

          <Box sx={{ flex: 1 }} />

          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <ColorModeToggle />
            <Button
              href="/admin/login"
              color="inherit"
              sx={{ display: { xs: "none", md: "inline-flex" }, color: "text.secondary" }}
            >
              Admin
            </Button>
            <GradientButton
              href="/submit-report"
              sx={{ display: { xs: "none", sm: "inline-flex" } }}
            >
              Report an incident
            </GradientButton>
            <IconButton
              aria-label="Open menu"
              onClick={() => setOpen(true)}
              sx={{ display: { md: "none" }, border: 1, borderColor: "divider", borderRadius: 2.5 }}
            >
              <MenuRoundedIcon fontSize="small" />
            </IconButton>
          </Box>
        </Toolbar>
      </Container>

      <Drawer
        anchor="right"
        open={open}
        onClose={() => setOpen(false)}
        slotProps={{ paper: { sx: { width: 300, p: 2 } } }}
      >
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
          <BrandMark size={32} />
          <IconButton aria-label="Close menu" onClick={() => setOpen(false)}>
            <CloseRoundedIcon />
          </IconButton>
        </Box>
        <List onClick={() => setOpen(false)}>
          {[...NAV_ITEMS, { label: "Admin sign in", href: "/admin/login" }].map((item) => (
            <ListItemButton
              key={item.href}
              component={Link}
              href={item.href}
              selected={isActive(pathname, item.href)}
              sx={{ borderRadius: 2, mb: 0.5 }}
            >
              <ListItemText
                primary={item.label}
                slotProps={{ primary: { sx: { fontWeight: 600 } } }}
              />
            </ListItemButton>
          ))}
        </List>
        <Divider sx={{ my: 2 }} />
        <GradientButton href="/submit-report" fullWidth size="large" onClick={() => setOpen(false)}>
          Report an incident
        </GradientButton>
      </Drawer>
    </AppBar>
  );
}

export default SiteHeader;
