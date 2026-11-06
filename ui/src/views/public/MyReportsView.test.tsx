import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/api/apiClient";
import {
  getContactChannels,
  getMyReports,
  requestSignInCode,
  verifySignInCode,
} from "@/api/passengerApi";
import { passengerSession } from "@/lib/passengerSession";
import { renderWithProviders } from "@/test/renderWithProviders";
import MyReportsView from "./MyReportsView";

vi.mock("@/api/passengerApi", () => ({
  requestSignInCode: vi.fn(),
  verifySignInCode: vi.fn(),
  getMyReports: vi.fn(),
  getContactChannels: vi.fn(),
}));
const mockedChannels = vi.mocked(getContactChannels);
const mockedRequest = vi.mocked(requestSignInCode);
const mockedVerify = vi.mocked(verifySignInCode);
const mockedReports = vi.mocked(getMyReports);

const contact = { channel: "phone" as const, display: "+9477***4567" };

describe("MyReportsView", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    passengerSession.set(null);
  });
  afterEach(() => passengerSession.set(null));

  it("asks for an email address only when SMS is switched off", async () => {
    mockedChannels.mockResolvedValue({ email: true, sms: false, push: false, telegram: false });
    renderWithProviders(<MyReportsView />);
    expect(await screen.findByLabelText("Email address")).toBeInTheDocument();
    expect(screen.queryByLabelText("Email or mobile number")).not.toBeInTheDocument();
  });

  it("signs in with a one-time code and lists the passenger's reports", async () => {
    const user = userEvent.setup({ delay: null });
    mockedRequest.mockResolvedValue({ channel: "phone", sentTo: "+9477***4567" });
    mockedVerify.mockResolvedValue({ token: "tok", contact });
    mockedReports.mockResolvedValue({
      contact,
      reports: [
        {
          receiptId: "BW-2026-ABCDEF",
          type: "complaint",
          status: "reviewed",
          category: "overcharging",
          busNumber: "NE-4521",
          routeNumber: "08",
          reportedAt: "2026-10-01T08:00:00.000Z",
          resolvedAt: null,
          lastUpdateAt: "2026-10-02T08:00:00.000Z",
          unreadMessages: 2,
        },
      ],
    });
    renderWithProviders(<MyReportsView />);

    await user.type(screen.getByLabelText("Email or mobile number"), "077 123 4567");
    await user.click(screen.getByRole("button", { name: "Send me a code" }));
    expect(mockedRequest).toHaveBeenCalledWith("077 123 4567", "en");
    expect(await screen.findByText(/a 6-digit code is on its way/)).toBeInTheDocument();

    await user.type(screen.getByLabelText("6-digit code"), "12a3456");
    await user.click(screen.getByRole("button", { name: "Sign in" }));
    expect(mockedVerify).toHaveBeenCalledWith("077 123 4567", "123456");

    expect(await screen.findByText("BW-2026-ABCDEF")).toBeInTheDocument();
    expect(screen.getByText("2 new messages")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /BW-2026-ABCDEF/ })).toHaveAttribute(
      "href",
      "/track/BW-2026-ABCDEF#messages",
    );
    expect(mockedReports).toHaveBeenCalledWith("tok");
  });

  it("checks the contact before sending a code", async () => {
    const user = userEvent.setup({ delay: null });
    renderWithProviders(<MyReportsView />);
    await user.type(screen.getByLabelText("Email or mobile number"), "12345");
    await user.click(screen.getByRole("button", { name: "Send me a code" }));
    expect(screen.getByText(/Enter your email address or a mobile number/)).toBeInTheDocument();
    expect(mockedRequest).not.toHaveBeenCalled();
  });

  it("explains a wrong code in the passenger's language", async () => {
    const user = userEvent.setup({ delay: null });
    mockedRequest.mockResolvedValue({ channel: "email", sentTo: "ka***@test.com" });
    mockedVerify.mockRejectedValue(new ApiError("wrong", 400, undefined, "invalid_code"));
    renderWithProviders(<MyReportsView />, { locale: "si" });

    await user.type(screen.getByLabelText("ඊමේලය හෝ ජංගම අංකය"), "kamal@test.com");
    await user.click(screen.getByRole("button", { name: "මට කේතයක් එවන්න" }));
    await user.type(await screen.findByLabelText("ඉලක්කම් 6ක කේතය"), "000000");
    await user.click(screen.getByRole("button", { name: "පිවිසෙන්න" }));
    expect(await screen.findByText(/එම කේතය වැරදියි/)).toBeInTheDocument();
  });

  it("asks to sign in again when the session has ended", async () => {
    passengerSession.set({ token: "old", contact });
    mockedReports.mockRejectedValue(new ApiError("Please sign in again.", 401));
    renderWithProviders(<MyReportsView />);
    expect(
      await screen.findByText("Your session has ended. Please sign in again."),
    ).toBeInTheDocument();
  });
});
