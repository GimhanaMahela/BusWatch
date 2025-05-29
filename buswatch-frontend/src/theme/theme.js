import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: {
      main: "#0056b3", // BusWatch Blue
    },
    secondary: {
      main: "#6c757d", // A neutral gray
    },
    error: {
      main: "#dc3545",
    },
    success: {
      main: "#28a745",
    },
    warning: {
      main: "#ffc107",
    },
    info: {
      main: "#17a2b8",
    },
    background: {
      default: "#f0f2f5", // Light gray background
      paper: "#ffffff", // White for cards, etc.
    },
  },
  typography: {
    fontFamily: ['"Roboto"', "sans-serif"].join(","),
    h1: {
      fontSize: "2.5rem",
      fontWeight: 700,
      "@media (min-width:600px)": {
        fontSize: "3.5rem",
      },
    },
    h2: {
      fontSize: "2rem",
      fontWeight: 600,
      "@media (min-width:600px)": {
        fontSize: "2.8rem",
      },
    },
    // You can define other typography variants here
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: "none", // Prevent uppercase by default
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: "none", // Remove shadow from app bar
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
        },
      },
    },
  },
});

export default theme;
