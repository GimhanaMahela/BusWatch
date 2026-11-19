import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { mockSearchParams, renderWithProviders } from "@/test/renderWithProviders";
import QrStickersView from "./QrStickersView";

describe("QrStickersView", () => {
  it("prints a sticker for the bus it was opened for", () => {
    mockSearchParams.current = new URLSearchParams("bus=NB-1234&route=08");
    renderWithProviders(<QrStickersView />);

    expect(screen.getByRole("img", { name: "QR code for bus NB-1234" })).toBeInTheDocument();
    expect(screen.getByText(`${window.location.host}/r/NB-1234?route=08`)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Print 1 sticker" })).toBeEnabled();
  });

  it("makes one sticker per valid line and reports the rest", async () => {
    const user = userEvent.setup();
    renderWithProviders(<QrStickersView />);
    expect(screen.getByRole("button", { name: /Print/ })).toBeDisabled();

    await user.type(
      screen.getByLabelText("Bus numbers"),
      "nb-1111{enter}NE-2222, 08{enter}???{enter}nb-1111",
    );

    expect(screen.getAllByRole("img", { name: /QR code for bus/ })).toHaveLength(2);
    expect(screen.getByRole("button", { name: "Print 2 stickers" })).toBeEnabled();
    expect(
      screen.getByText(/Skipped a line that isn't a bus number: \\?\\?\\?/),
    ).toBeInTheDocument();
  });
});
