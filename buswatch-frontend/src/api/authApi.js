import axios from "axios";

const API_URL =
  process.env.REACT_APP_BACKEND_URL || "http://localhost:5000/api";

export const loginAdmin = async (email, password) => {
  try {
    const response = await axios.post(`${API_URL}/auth/login`, {
      email,
      password,
    });
    return response.data; // Contains the token
  } catch (error) {
    throw error.response.data; // Throw backend error message
  }
};

export const getAdminProfile = async (token) => {
  try {
    const config = {
      headers: {
        "x-auth-token": token,
      },
    };
    const response = await axios.get(`${API_URL}/auth`, config);
    return response.data; // Contains admin details
  } catch (error) {
    throw error.response.data;
  }
};

