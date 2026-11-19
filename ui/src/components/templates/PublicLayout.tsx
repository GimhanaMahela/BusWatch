import { Box } from "@mui/material";
import type { ReactNode } from "react";
import { ChatHelper, OfflineOutbox, SiteFooter, SiteHeader } from "@/components/organisms";

/** Chrome for public pages: sticky header, page content, footer, and the helper chat. */
function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <SiteHeader />
      <Box component="main" sx={{ flex: 1 }}>
        {children}
      </Box>
      <SiteFooter />
      <OfflineOutbox />
      <ChatHelper />
    </Box>
  );
}

export default PublicLayout;
