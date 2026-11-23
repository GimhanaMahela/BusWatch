import { routeFromNotification } from "./push";

jest.mock("expo-notifications", () => ({ setNotificationHandler: jest.fn() }));

describe("routeFromNotification", () => {
  it("opens the report a notification is about", () => {
    expect(routeFromNotification({ url: "/track/BW-2026-ABC123" })).toBe("/track/BW-2026-ABC123");
    expect(routeFromNotification({ url: "/track/bw-2026-abc123#messages" })).toBe(
      "/track/BW-2026-ABC123",
    );
  });

  it("ignores anything else", () => {
    expect(routeFromNotification({ url: "https://evil.example/track/x" })).toBeNull();
    expect(routeFromNotification({})).toBeNull();
    expect(routeFromNotification(null)).toBeNull();
  });
});
