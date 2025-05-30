// src/index.js
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index";
import { ThemeProvider } from "@mui/material/styles"; 
import { BrowserRouter } from "react-router-dom";
import theme from "./theme/theme"; 
import { AuthProvider } from "./context/AuthContext";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);
