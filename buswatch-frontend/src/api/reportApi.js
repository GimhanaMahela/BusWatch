import client, { toApiError } from "./apiClient";

const call = async (request) => {
  try {
    const response = await request;
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
};

export const submitReport = (reportData, images = [], videos = []) => {
  const formData = new FormData();

  // Append text fields
  for (const key in reportData) {
    if (reportData[key] !== undefined && reportData[key] !== null && reportData[key] !== "") {
      formData.append(key, reportData[key]);
    }
  }
  images.forEach((image) => formData.append("images", image));
  videos.forEach((video) => formData.append("videos", video));

  return call(client.post("/reports", formData));
};

// Public: passenger looks up their own report
export const trackReport = (receiptId) =>
  call(client.get(`/reports/track/${encodeURIComponent(receiptId.trim())}`));

// params: { page, limit, status, category, q, from, to }
export const getAllReports = (params = {}) =>
  call(client.get("/reports", { params }));

export const getReportStats = () => call(client.get("/reports/stats"));

export const getReportById = (id) => call(client.get(`/reports/${id}`));

export const getReportByReceiptId = (receiptId) =>
  call(client.get(`/reports/receipt/${encodeURIComponent(receiptId.trim())}`));

export const updateReportStatus = (id, status, note = "", notifyPassenger = true) =>
  call(client.put(`/reports/${id}/status`, { status, note, notifyPassenger }));

export const addReportNote = (id, text) =>
  call(client.post(`/reports/${id}/notes`, { text }));

export const deleteReport = (id) => call(client.delete(`/reports/${id}`));
