import { Box } from "@mui/material";
import { Suspense } from "react";
import { Outlet } from "react-router";
import { LoadingState } from "../molecules";
import { Footer, Header } from "../organisms";

/** Site chrome shared by every page: header, page content, footer. */
function MainLayout() {
  return (
    <>
      <Header />
      <Box component="main">
        {/* Pages are lazy-loaded; keep the header/footer visible while one loads */}
        <Suspense fallback={<LoadingState />}>
          <Outlet />
        </Suspense>
      </Box>
      <Footer />
    </>
  );
}

export default MainLayout;
