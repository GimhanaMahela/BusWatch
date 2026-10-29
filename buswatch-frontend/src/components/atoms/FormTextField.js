import { TextField } from "@mui/material";
import { styled } from "@mui/material/styles";

/** Outlined text field with the brand focus/hover treatment used on public forms. */
const FormTextField = styled(TextField)(({ theme }) => ({
  marginBottom: theme.spacing(3),
  "& .MuiOutlinedInput-root": {
    borderRadius: theme.shape.borderRadius,
    transition: "all 0.3s ease-in-out",
    "& fieldset": {
      borderColor: theme.palette.grey[300],
    },
    "&:hover fieldset": {
      borderColor: theme.palette.primary.main,
    },
    "&.Mui-focused fieldset": {
      borderColor: theme.palette.primary.dark,
      boxShadow: `0 0 0 2px ${theme.palette.primary.light}40`,
    },
  },
  "& .MuiInputLabel-root": {
    color: theme.palette.text.secondary,
    "&.Mui-focused": {
      color: theme.palette.primary.dark,
    },
  },
}));

export default FormTextField;
