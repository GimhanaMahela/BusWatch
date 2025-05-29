// src/index.js
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index";
import { ThemeProvider } from "@mui/material/styles"; // <--- Ensure this import is correct
import { BrowserRouter } from "react-router-dom";
import theme from "./theme/theme"; // <--- Ensure your custom theme is imported correctly
import { AuthProvider } from "./context/AuthContext";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      {/* <--- The ThemeProvider must wrap your App component */}
      <ThemeProvider theme={theme}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);
