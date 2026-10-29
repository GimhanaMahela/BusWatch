import { Typography } from "@mui/material";
import { styled } from "@mui/material/styles";

/** Brand-coloured heading for a section of a long-form content page. */
const SectionHeading = styled(Typography)(({ theme }) => ({
  marginTop: theme.spacing(4),
  marginBottom: theme.spacing(2),
  fontWeight: 600,
  color: theme.palette.primary.main,
}));

export default SectionHeading;
