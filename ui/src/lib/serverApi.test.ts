import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { fetchPublic, PublicDataError } from "./serverApi";

vi.mock("next/headers", () => ({
  headers: () => Promise.resolve(new Headers({ host: "transitx.example" })),
}));

const respond = (body: string, contentType: string, status = 200) =>
  vi
    .fn()
    .mockResolvedValue(new Response(body, { status, headers: { "content-type": contentType } }));

describe("fetchPublic", () => {
  beforeEach(() => vi.unstubAllEnvs());
  afterEach(() => vi.unstubAllGlobals());

  it("returns the API's JSON from this site's /api", async () => {
    const fetchMock = respond('{"total":3}', "application/json; charset=utf-8");
    vi.stubGlobal("fetch", fetchMock);
    await expect(fetchPublic("/stats")).resolves.toEqual({ total: 3 });
    expect(fetchMock).toHaveBeenCalledWith("https://transitx.example/api/stats", expect.anything());
  });

  it("sends Vercel's protection bypass secret when one is configured", async () => {
    vi.stubEnv("VERCEL_AUTOMATION_BYPASS_SECRET", "s3cret");
    const fetchMock = respond("{}", "application/json");
    vi.stubGlobal("fetch", fetchMock);
    await fetchPublic("/stats");
    expect(fetchMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ headers: { "x-vercel-protection-bypass": "s3cret" } }),
    );
  });

  it("treats an HTML page (e.g. a login wall) as the API being unreachable", async () => {
    vi.stubGlobal("fetch", respond("<!DOCTYPE html><html></html>", "text/html"));
    await expect(fetchPublic("/stats")).rejects.toBeInstanceOf(PublicDataError);
  });
});
