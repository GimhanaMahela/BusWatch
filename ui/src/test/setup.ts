import "@testing-library/jest-dom/vitest";
// In-memory IndexedDB for offline drafts and the outbox
import "fake-indexeddb/auto";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";
import { mockRouter, mockSearchParams } from "./mockRouter";

// Components use Next's App Router hooks; outside Next they need a stand-in.
// Tests set `mockSearchParams.current` to simulate a query string (e.g. a QR link).
vi.mock("next/navigation", () => ({
  useRouter: () => mockRouter,
  usePathname: () => "/",
  useSearchParams: () => mockSearchParams.current,
}));

afterEach(() => {
  cleanup();
  localStorage.clear();
  sessionStorage.clear();
  mockSearchParams.current = new URLSearchParams();
});
