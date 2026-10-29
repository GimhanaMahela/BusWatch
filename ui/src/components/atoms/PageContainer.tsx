import { Container } from "@mui/material";
import { styled } from "@mui/material/styles";

/** Page-width container with the standard vertical rhythm for content pages. */
const PageContainer = styled(Container)(({ theme }) => ({
  marginTop: theme.spacing(4),
  marginBottom: theme.spacing(4),
  padding: theme.spacing(3),
  [theme.breakpoints.up("md")]: {
    padding: theme.spacing(5),
  },
}));

export default PageContainer;
