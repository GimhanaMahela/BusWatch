import { Box } from "@mui/material";
import type { ReactNode } from "react";
import { AdminGuard, AdminNavigation } from "@/components/organisms";

/** Admin console: guarded, with the sidebar beside the page content. */
function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AdminGuard>
      <Box sx={{ display: { md: "flex" }, minHeight: "100vh" }}>
        <AdminNavigation />
        <Box
          component="main"
          sx={{
            flex: 1,
            minWidth: 0,
            px: { xs: 2, sm: 3, lg: 5 },
            py: { xs: 3, md: 5 },
            // Printing (e.g. QR sticker sheets): only the page content, edge to edge
            "@media print": { p: 0 },
          }}
        >
          <Box sx={{ maxWidth: 1400, mx: "auto" }}>{children}</Box>
        </Box>
      </Box>
    </AdminGuard>
  );
}

export default AdminLayout;
