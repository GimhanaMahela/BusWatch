import { parseBusSticker } from "./qr";

describe("parseBusSticker", () => {
  it("reads the bus and route from a TransitX sticker link", () => {
    expect(parseBusSticker("https://transitx.lk/r/NB-1234?route=08")).toEqual({
      bus: "NB-1234",
      route: "08",
    });
    expect(parseBusSticker("https://transitx.lk/r/nb%201234")).toEqual({
      bus: "NB 1234",
      route: "",
    });
  });

  it("ignores codes that aren't bus stickers", () => {
    expect(parseBusSticker("hello")).toBeNull();
    expect(parseBusSticker("https://transitx.lk/track/BW-2026-ABC123")).toBeNull();
    expect(parseBusSticker("javascript:alert(1)")).toBeNull();
    expect(parseBusSticker("https://transitx.lk/r/%3Cscript%3E")).toBeNull();
  });
});
