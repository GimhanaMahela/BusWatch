"use client";

import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import { AppBar, Box, Button, Toolbar, Typography } from "@mui/material";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BrandMark, ColorModeToggle } from "@/components/atoms";
import useAuth from "@/hooks/useAuth";

/** Operator portal header: brand, the operator's name, colour mode and sign out. */
function OperatorTopBar() {
  const { admin, logout } = useAuth();
  const router = useRouter();

  const signOut = () => {
    logout();
    router.replace("/admin/login");
  };

  return (
    <AppBar
      position="sticky"
      sx={{ top: 0, pt: 1.5, px: { xs: 2, sm: 3 }, bgcolor: "transparent", color: "text.primary" }}
    >
      {/* A floating rounded bar, like the public site's header */}
      <Toolbar
        sx={{
          gap: 1.5,
          maxWidth: 1536,
          width: "100%",
          mx: "auto",
          borderRadius: 99,
          border: 1,
          borderColor: "divider",
          bgcolor: "rgba(var(--mui-palette-background-paperChannel) / 0.85)",
          backdropFilter: "blur(14px)",
          boxShadow: "var(--bw-shadow-card)",
        }}
      >
        <Box
          component={Link}
          href="/operator"
          sx={{ display: "flex", alignItems: "center", gap: 1.5, textDecoration: "none" }}
        >
          <BrandMark size={30} />
          <Typography
            variant="caption"
            sx={{
              fontWeight: 700,
              px: 1,
              py: 0.25,
              borderRadius: 1.5,
              color: "secondary.main",
              bgcolor: "rgba(var(--mui-palette-secondary-mainChannel) / 0.12)",
              display: { xs: "none", sm: "inline" },
            }}
          >
            Operator portal
          </Typography>
        </Box>
        <Box sx={{ flex: 1 }} />
        <Typography
          variant="body2"
          noWrap
          sx={{ fontWeight: 600, display: { xs: "none", sm: "block" }, maxWidth: 260 }}
        >
          {admin?.organisation ?? admin?.email}
        </Typography>
        <ColorModeToggle />
        <Button size="small" startIcon={<LogoutRoundedIcon />} onClick={signOut}>
          Sign out
        </Button>
      </Toolbar>
    </AppBar>
  );
}

export default OperatorTopBar;
