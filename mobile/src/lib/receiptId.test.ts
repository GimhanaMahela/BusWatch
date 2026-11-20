import { isReceiptId, normaliseReceiptId } from "./receiptId";

describe("receipt IDs", () => {
  it("tidies pasted or typed input", () => {
    expect(normaliseReceiptId("  bw-2026-7kq4mz ")).toBe("BW-2026-7KQ4MZ");
    expect(normaliseReceiptId("BW-2026- 7KQ4MZ")).toBe("BW-2026-7KQ4MZ");
  });

  it("recognises the receipt format", () => {
    expect(isReceiptId("bw-2026-7kq4mz")).toBe(true);
    expect(isReceiptId("2026-7KQ4MZ")).toBe(false);
  });
});
