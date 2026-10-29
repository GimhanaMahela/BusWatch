import React from "react";
import { Paper, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { PageContainer } from "../atoms";

const ContentPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  borderRadius: theme.shape.borderRadius * 2,
  boxShadow: theme.shadows[8],
  background: `linear-gradient(145deg, ${theme.palette.background.paper}, ${theme.palette.grey[50]})`,
}));

/** Long-form text page (policies, terms): centred card with a page title. */
function ContentPageTemplate({ title, children }) {
  return (
    <PageContainer maxWidth="md">
      <ContentPaper elevation={3}>
        <Typography
          variant="h4"
          component="h1"
          gutterBottom
          align="center"
          sx={{ fontWeight: 700, color: "primary.dark" }}
        >
          {title}
        </Typography>
        {children}
      </ContentPaper>
    </PageContainer>
  );
}

export default ContentPageTemplate;
