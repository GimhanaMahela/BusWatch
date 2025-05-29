import axios from "axios";

const API_URL =
  process.env.REACT_APP_BACKEND_URL || "http://localhost:5000/api";

export const submitReport = async (reportData, images = [], videos = []) => {
  try {
    const formData = new FormData();

    // Append text fields
    for (const key in reportData) {
      if (reportData[key] !== undefined && reportData[key] !== null) {
        formData.append(key, reportData[key]);
      }
    }

    // Append images
    images.forEach((image, index) => {
      formData.append(`images`, image);
    });

    // Append videos
    videos.forEach((video, index) => {
      formData.append(`videos`, video);
    });

    const response = await axios.post(`${API_URL}/reports`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const getAllReports = async (token) => {
  try {
    const config = {
      headers: {
        "x-auth-token": token,
      },
    };
    const response = await axios.get(`${API_URL}/reports`, config);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const getReportById = async (id, token) => {
  try {
    const config = {
      headers: {
        "x-auth-token": token,
      },
    };
    const response = await axios.get(`${API_URL}/reports/${id}`, config);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const updateReportStatus = async (id, status, token) => {
  try {
    const config = {
      headers: {
        "x-auth-token": token,
      },
    };
    const response = await axios.put(
      `${API_URL}/reports/${id}/status`,
      { status },
      config
    );
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};

export const deleteReport = async (id, token) => {
  try {
    const config = {
      headers: {
        "x-auth-token": token,
      },
    };
    const response = await axios.delete(`${API_URL}/reports/${id}`, config);
    return response.data;
  } catch (error) {
    throw error.response.data;
  }
};
