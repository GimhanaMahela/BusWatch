import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import request from "supertest";
import { afterAll, beforeAll, beforeEach } from "vitest";
import { createApp } from "../src/app.js";
import { AdminModel } from "../src/models/admin.model.js";

export const app = createApp();

/** Starts an in-memory MongoDB for the test file and clears it between tests. */
export const useTestDatabase = () => {
  let mongo: MongoMemoryServer;

  beforeAll(async () => {
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri());
  });

  beforeEach(async () => {
    await mongoose.connection.db?.dropDatabase();
    await Promise.all(Object.values(mongoose.models).map((model) => model.syncIndexes()));
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongo.stop();
  });
};

export const createAdminAndLogin = async (
  email = "root@test.com",
  role: "superadmin" | "admin" = "superadmin",
) => {
  const password = "supersecret1";
  await AdminModel.create({ email, password, role });
  const res = await request(app).post("/api/auth/login").send({ email, password });
  return res.body.token as string;
};

/** Submits a report through the public endpoint (multipart, like the real form). */
export const submitReport = (fields: Record<string, string> = {}) => {
  const req = request(app).post("/api/reports");
  const data = {
    busNumber: "ne-9999",
    routeNumber: "08",
    location: "Ambepussa Junction",
    description: "Driver was speeding",
    category: "reckless_driving",
    ...fields,
  };
  for (const [key, value] of Object.entries(data)) req.field(key, value);
  return req;
};
