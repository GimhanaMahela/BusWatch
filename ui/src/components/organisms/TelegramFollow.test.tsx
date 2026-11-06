import { screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getContactChannels } from "@/api/passengerApi";
import { getTelegramLink } from "@/api/pushApi";
import { renderWithProviders } from "@/test/renderWithProviders";
import TelegramFollow from "./TelegramFollow";

vi.mock("@/api/passengerApi", () => ({ getContactChannels: vi.fn() }));
vi.mock("@/api/pushApi", () => ({ getTelegramLink: vi.fn() }));
const mockedChannels = vi.mocked(getContactChannels);
const mockedLink = vi.mocked(getTelegramLink);

const channels = { email: true, sms: false, push: false, telegram: true };
const url = "https://t.me/BusWatchBot?start=BW-2026-ABCDEF_abc_0123456789abcdef";

describe("TelegramFollow", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockedLink.mockResolvedValue({ url });
  });

  it("links to the bot with the report's follow token", async () => {
    mockedChannels.mockResolvedValue(channels);
    renderWithProviders(<TelegramFollow receiptId="BW-2026-ABCDEF" />);

    const button = await screen.findByRole("link", { name: /Open Telegram/ });
    expect(button).toHaveAttribute("href", url);
    expect(button).toHaveAttribute("target", "_blank");
    expect(mockedLink).toHaveBeenCalledWith("BW-2026-ABCDEF");
    expect(screen.getByText(/Send \/stop/)).toBeInTheDocument();
  });

  it("stays hidden when no Telegram bot is set up", async () => {
    mockedChannels.mockResolvedValue({ ...channels, telegram: false });
    const { container } = renderWithProviders(<TelegramFollow receiptId="BW-2026-ABCDEF" />);
    await vi.waitFor(() => expect(mockedChannels).toHaveBeenCalled());
    expect(container).toBeEmptyDOMElement();
    expect(mockedLink).not.toHaveBeenCalled();
  });
});
