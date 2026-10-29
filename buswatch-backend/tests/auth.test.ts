import request from "supertest";
import { describe, expect, it } from "vitest";
import { app, createAdminAndLogin, useTestDatabase } from "./helpers.js";

useTestDatabase();

describe("auth", () => {
  it("rejects registration without a token", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "x@x.com", password: "12345678" });
    expect(res.status).toBe(401);
  });

  it("lets a superadmin create an admin, who can then log in", async () => {
    const token = await createAdminAndLogin();

    const created = await request(app)
      .post("/api/auth/register")
      .set("x-auth-token", token)
      .send({ email: "Officer@Test.com", password: "officerpass" });
    expect(created.status).toBe(201);
    expect(created.body.admin).toMatchObject({ email: "officer@test.com", role: "admin" });

    const login = await request(app)
      .post("/api/auth/login")
      .send({ email: "officer@test.com", password: "officerpass" });
    expect(login.status).toBe(200);
    expect(login.body.token).toEqual(expect.any(String));
  });

  it("forbids a regular admin from creating admins", async () => {
    const token = await createAdminAndLogin("officer@test.com", "admin");
    const res = await request(app)
      .post("/api/auth/register")
      .set("x-auth-token", token)
      .send({ email: "y@y.com", password: "12345678" });
    expect(res.status).toBe(403);
  });

  it("validates new admin input", async () => {
    const token = await createAdminAndLogin();
    const res = await request(app)
      .post("/api/auth/register")
      .set("x-auth-token", token)
      .send({ email: "not-an-email", password: "short" });
    expect(res.status).toBe(400);
    expect(res.body.errors).toContain("A valid email is required");
  });

  it("returns the same error for an unknown email and a wrong password", async () => {
    await createAdminAndLogin();
    const unknown = await request(app)
      .post("/api/auth/login")
      .send({ email: "nobody@test.com", password: "whatever1" });
    const wrong = await request(app)
      .post("/api/auth/login")
      .send({ email: "root@test.com", password: "wrongpass" });
    expect(unknown.status).toBe(400);
    expect(wrong.body).toEqual(unknown.body);
  });
});
