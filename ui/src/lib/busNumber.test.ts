import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { GET } from "@/app/r/[bus]/route";
import { busQuery, isNewQrScan, parseBusNumber, parseRoute, qrShortPath } from "./busNumber";

describe("bus numbers from QR links", () => {
  it.each([
    ["nb-1234", "NB-1234"],
    ["  NE  4521 ", "NE 4521"],
    ["62-1182", "62-1182"],
    ["<script>", ""],
    ["NB-1234; DROP", ""],
    ["A".repeat(21), ""],
    [null, ""],
  ])("parses %s as %s", (input, expected) => {
    expect(parseBusNumber(input)).toBe(expected);
  });

  it("keeps routes printable and short", () => {
    expect(parseRoute(" Colombo–Matale ")).toBe("Colombo–Matale");
    expect(parseRoute("08<b>\u0007")).toBe("08b");
    expect(parseRoute("x".repeat(80))).toHaveLength(60);
  });

  it("builds form links and sticker paths", () => {
    expect(busQuery("NB-1234", "08", "qr")).toBe("?bus=NB-1234&route=08&src=qr");
    expect(busQuery("", "")).toBe("");
    expect(qrShortPath("NB 1234", "Kandy–Matale")).toBe("/r/NB%201234?route=Kandy%E2%80%93Matale");
  });

  it("counts a sticker scan once per bus per session", () => {
    expect(isNewQrScan("NB-1234")).toBe(true);
    expect(isNewQrScan("NB-1234")).toBe(false);
    expect(isNewQrScan("NE-4521")).toBe(true);
  });
});

describe("/r/<bus> short link", () => {
  const follow = async (path: string) => {
    const url = new URL(path, "https://buswatch.example");
    const bus = url.pathname.split("/").pop() ?? "";
    const response = await GET(new NextRequest(url), { params: Promise.resolve({ bus }) });
    return { status: response.status, location: response.headers.get("location") };
  };

  it("opens the report form with the bus filled in and marks it as a QR scan", async () => {
    expect(await follow("/r/nb-1234?route=08")).toEqual({
      status: 307,
      location: "https://buswatch.example/submit-report?bus=NB-1234&route=08&src=qr",
    });
  });

  it("decodes spaces and ignores junk", async () => {
    expect((await follow("/r/NE%204521")).location).toBe(
      "https://buswatch.example/submit-report?bus=NE+4521&src=qr",
    );
    expect((await follow("/r/%E0%A4%A")).location).toBe("https://buswatch.example/submit-report");
    expect((await follow("/r/%3Cscript%3E")).location).toBe(
      "https://buswatch.example/submit-report",
    );
  });
});
