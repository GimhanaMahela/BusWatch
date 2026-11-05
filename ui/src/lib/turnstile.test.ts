import { describe, expect, it } from "vitest";
import { getTurnstileToken, isTurnstileEnabled } from "./turnstile";

describe("turnstile", () => {
  it("does nothing when no site key is configured", async () => {
    expect(isTurnstileEnabled()).toBe(false);
    expect(await getTurnstileToken()).toBeNull();
    expect(document.querySelector('script[src*="turnstile"]')).toBeNull();
  });
});
