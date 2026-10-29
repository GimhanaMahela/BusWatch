import client, { toApiError } from "./apiClient";

const call = async (request) => {
  try {
    const response = await request;
    return response.data;
  } catch (error) {
    throw toApiError(error);
  }
};

export const loginAdmin = (email, password) =>
  call(client.post("/auth/login", { email, password })); // { token }

export const getAdminProfile = () => call(client.get("/auth"));

// Superadmin only
export const listAdmins = () => call(client.get("/auth/admins"));

export const createAdmin = (email, password, role = "admin") =>
  call(client.post("/auth/register", { email, password, role }));
