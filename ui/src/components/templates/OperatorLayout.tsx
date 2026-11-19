import { Box } from "@mui/material";
import type { ReactNode } from "react";
import { AdminGuard, OperatorTopBar } from "@/components/organisms";

/** Operator portal: only for bus operator accounts, with a slim top bar. */
function OperatorLayout({ children }: { children: ReactNode }) {
  return (
    <AdminGuard area="operator">
      <OperatorTopBar />
      <Box
        component="main"
        sx={{ px: { xs: 2, sm: 3 }, py: { xs: 3, md: 5 }, maxWidth: 1200, mx: "auto" }}
      >
        {children}
      </Box>
    </AdminGuard>
  );
}

export default OperatorLayout;
