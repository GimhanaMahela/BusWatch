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
      sx={{
        borderBottom: 1,
        borderColor: "divider",
        bgcolor: "rgba(var(--mui-palette-background-defaultChannel) / 0.85)",
        backdropFilter: "blur(14px)",
        color: "text.primary",
      }}
    >
      <Toolbar sx={{ gap: 1.5, maxWidth: 1200, width: "100%", mx: "auto" }}>
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
