import { vi } from "vitest";

/** Stand-in for Next's router (wired up in setup.ts); tests assert on these calls. */
export const mockRouter = {
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
  refresh: vi.fn(),
  prefetch: vi.fn(),
};

/** Query string seen by useSearchParams(); reset after each test. */
export const mockSearchParams = { current: new URLSearchParams() };
