import axios from "axios";

// All API calls go through this client so they hit the configured backend in
// every environment (the dev "proxy" setting only works with `npm start`).
export const API_URL =
  process.env.REACT_APP_BACKEND_URL || "http://localhost:5000/api";

const client = axios.create({ baseURL: API_URL });

client.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers["x-auth-token"] = token;
  }
  return config;
});

// Normalise errors to the backend's JSON body ({ msg } or { message })
export const toApiError = (error) => {
  const data = error.response?.data;
  if (data && typeof data === "object") {
    return { ...data, message: data.message || data.msg, status: error.response.status };
  }
  return {
    message:
      error.response?.status >= 500
        ? "Server error. Please try again later."
        : "Could not reach the server. Check your connection.",
    status: error.response?.status,
  };
};

export default client;
