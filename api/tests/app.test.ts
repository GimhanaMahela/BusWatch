import request from "supertest";
import { describe, expect, it } from "vitest";
import { app } from "./helpers.js";

describe("app", () => {
  it("responds to the health check", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
  });

  it("returns JSON 404s for unknown routes", async () => {
    const res = await request(app).get("/api/nope");
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ msg: "Not found" });
  });

  it("sets security headers", async () => {
    const res = await request(app).get("/health");
    expect(res.headers["x-content-type-options"]).toBe("nosniff");
  });
});
