import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import StatusChip from "./StatusChip";

describe("StatusChip", () => {
  it("shows the human label for a status", () => {
    render(<StatusChip status="rejected" />);
    expect(screen.getByText("Closed")).toBeInTheDocument();
  });

  it("can upper-case the label", () => {
    render(<StatusChip status="pending" uppercase />);
    expect(screen.getByText("PENDING")).toBeInTheDocument();
  });
});
