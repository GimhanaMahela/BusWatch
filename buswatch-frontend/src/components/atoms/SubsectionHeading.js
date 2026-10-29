import { Typography } from "@mui/material";
import { styled } from "@mui/material/styles";

/** Heading for a subsection under a SectionHeading. */
const SubsectionHeading = styled(Typography)(({ theme }) => ({
  marginTop: theme.spacing(3),
  marginBottom: theme.spacing(1),
  fontWeight: 500,
  color: theme.palette.text.primary,
}));

export default SubsectionHeading;
