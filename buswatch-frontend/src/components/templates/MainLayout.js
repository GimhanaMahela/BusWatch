import React from "react";
import { Outlet } from "react-router-dom";
import { Box } from "@mui/material";
import { Footer, Header } from "../organisms";

/** Site chrome shared by every page: header, page content, footer. */
function MainLayout() {
  return (
    <>
      <Header />
      <Box component="main">
        <Outlet />
      </Box>
      <Footer />
    </>
  );
}

export default MainLayout;
