import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { mockRouter, renderWithProviders } from "@/test/renderWithProviders";
import LanguageSwitcher from "./LanguageSwitcher";

describe("LanguageSwitcher", () => {
  it("remembers the chosen language and re-renders the page in it", async () => {
    mockRouter.refresh.mockReset();
    const user = userEvent.setup();
    renderWithProviders(<LanguageSwitcher />);

    await user.click(screen.getByRole("button", { name: "Change language" }));
    await user.click(screen.getByRole("menuitem", { name: "தமிழ்" }));

    expect(document.cookie).toContain("NEXT_LOCALE=ta");
    expect(mockRouter.refresh).toHaveBeenCalled();
  });
});
