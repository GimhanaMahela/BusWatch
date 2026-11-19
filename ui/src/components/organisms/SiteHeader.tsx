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
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { BrandMark, ColorModeToggle, GradientButton, LanguageSwitcher } from "@/components/atoms";
import { InstallAppButton } from "@/components/molecules";

const NAV_ITEMS = [
  { key: "home", href: "/" },
  { key: "track", href: "/track" },
  { key: "myReports", href: "/my-reports" },
  { key: "commend", href: "/commend-a-driver" },
  { key: "safety", href: "/safety" },
  { key: "impact", href: "/impact" },
  { key: "about", href: "/about-us" },
] as const;

const isActive = (pathname: string, href: string) =>
  href === "/" ? pathname === "/" : pathname.startsWith(href);

/** Sticky, translucent top bar for the public site. */
function SiteHeader() {
  const t = useTranslations("header");
  // Sinhala and Tamil labels are much longer than English and don't fit beside the actions in the
  // ~1200px header, so those languages always use the menu button
  const fullNav = useLocale() === "en";
  const navShown = fullNav ? "flex" : "none";
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <AppBar
      position="sticky"
      sx={{ top: 0, pt: { xs: 1, md: 1.5 }, color: "text.primary", bgcolor: "transparent" }}
    >
      {/* A floating, rounded bar that matches the bento tiles below it */}
      <Container maxWidth="lg">
        <Toolbar
          sx={{
            gap: 2,
            minHeight: { xs: 60, md: 64 },
            px: { xs: 1.5, md: 2 },
            borderRadius: { xs: 4, md: 99 },
            border: 1,
            borderColor: "divider",
            bgcolor: "rgba(var(--mui-palette-background-paperChannel) / 0.82)",
            backdropFilter: "saturate(180%) blur(16px)",
            boxShadow: "var(--bw-shadow-card)",
          }}
        >
          <Box
            component={Link}
            href="/"
            aria-label={t("homeLink")}
            sx={{ display: "flex", textDecoration: "none" }}
          >
            <BrandMark />
          </Box>

          <Box
            component="nav"
            aria-label={t("mainNav")}
            sx={{ display: { xs: "none", lg: navShown }, gap: 0.25, ml: 2 }}
          >
            {NAV_ITEMS.map((item) => {
              const active = isActive(pathname, item.href);
              return (
                <Button
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  sx={{
                    position: "relative",
                    whiteSpace: "nowrap",
                    borderRadius: 999,
                    color: active ? "primary.main" : "text.secondary",
                    fontWeight: active ? 750 : 600,
                    bgcolor: active
                      ? "rgba(var(--mui-palette-primary-mainChannel) / 0.08)"
                      : "transparent",
                    "&:hover": { color: "text.primary", bgcolor: "action.hover" },
                    "&::after": active
                      ? {
                          content: '""',
                          position: "absolute",
                          left: "50%",
                          bottom: 3,
                          width: 16,
                          height: 3,
                          borderRadius: 3,
                          transform: "translateX(-50%)",
                          background: "var(--bw-gradient-brand)",
                        }
                      : undefined,
                  }}
                >
                  {t(item.key)}
                </Button>
              );
            })}
          </Box>

          <Box sx={{ flex: 1 }} />

          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <LanguageSwitcher />
            <ColorModeToggle />
            <Button
              href="/admin/login"
              color="inherit"
              sx={{
                // Also in the menu and the footer; shown here only where there is room
                display: { xs: "none", xl: fullNav ? "inline-flex" : "none" },
                color: "text.secondary",
                whiteSpace: "nowrap",
              }}
            >
              {t("admin")}
            </Button>
            <GradientButton
              href="/submit-report"
              sx={{ display: { xs: "none", sm: "inline-flex" }, whiteSpace: "nowrap" }}
            >
              {t("report")}
            </GradientButton>
            <IconButton
              aria-label={t("openMenu")}
              onClick={() => setOpen(true)}
              sx={{
                display: { lg: fullNav ? "none" : "inline-flex" },
                border: 1,
                borderColor: "divider",
                borderRadius: 999,
                bgcolor: "background.paper",
              }}
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
          <IconButton aria-label={t("closeMenu")} onClick={() => setOpen(false)}>
            <CloseRoundedIcon />
          </IconButton>
        </Box>
        <List onClick={() => setOpen(false)}>
          {[...NAV_ITEMS, { key: "adminSignIn", href: "/admin/login" } as const].map((item) => (
            <ListItemButton
              key={item.href}
              component={Link}
              href={item.href}
              selected={isActive(pathname, item.href)}
              sx={{
                borderRadius: 3,
                mb: 0.5,
                "&.Mui-selected": {
                  color: "primary.main",
                  bgcolor: "rgba(var(--mui-palette-primary-mainChannel) / 0.1)",
                },
              }}
            >
              <ListItemText
                primary={t(item.key)}
                slotProps={{ primary: { sx: { fontWeight: 600 } } }}
              />
            </ListItemButton>
          ))}
        </List>
        <Divider sx={{ my: 2 }} />
        <GradientButton href="/submit-report" fullWidth size="large" onClick={() => setOpen(false)}>
          {t("report")}
        </GradientButton>
        <InstallAppButton fullWidth size="large" sx={{ mt: 1.5 }} />
      </Drawer>
    </AppBar>
  );
}

export default SiteHeader;
