import { screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/renderWithProviders";
import type { BusScorecard, RouteScorecard } from "@/types/public";
import ScorecardView from "./ScorecardView";

vi.mock("@mui/x-charts/BarChart", () => ({ BarChart: () => null }));

const base = { minPublicReports: 3, since: "2026-01" };

describe("ScorecardView", () => {
  it("explains the fairness rule while a bus has too few checked reports", () => {
    const card: BusScorecard = {
      ...base,
      busNumber: "NB-1234",
      published: false,
      complaints: null,
      commendations: null,
    };
    renderWithProviders(<ScorecardView kind="bus" card={card} />);

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("NB-1234");
    expect(screen.getByText("No scorecard yet")).toBeInTheDocument();
    expect(screen.getByText(/at least 3 reports checked by our team/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Report an incident on this bus/ })).toHaveAttribute(
      "href",
      "/submit-report?bus=NB-1234",
    );
  });

  it("shows a bus's checked figures", () => {
    const card: BusScorecard = {
      ...base,
      busNumber: "NB-1234",
      busName: "Nuwantha Express",
      routes: ["08"],
      published: true,
      complaints: {
        checked: 9,
        resolved: 6,
        inProgress: 3,
        resolutionRate: 67,
        byCategory: [{ category: "overcharging", count: 5 }],
        averageRating: null,
        byMonth: [{ month: "2026-11", count: 2 }],
      },
      commendations: { count: 2, byCategory: [{ category: "safe_driving", count: 2 }] },
    };
    renderWithProviders(<ScorecardView kind="bus" card={card} />);

    expect(screen.getByText("Nuwantha Express · Routes: 08")).toBeInTheDocument();
    expect(screen.getByText("Resolution rate: 67%")).toBeInTheDocument();
    expect(screen.getByText("Overcharging / wrong fare")).toBeInTheDocument();
    expect(screen.getByText("Safe, careful driving")).toBeInTheDocument();
  });

  it("publishes praise but not a handful of complaints, and links a route's buses", () => {
    const card: RouteScorecard = {
      ...base,
      routeNumber: "Kandy–Matale",
      published: true,
      complaints: null,
      commendations: { count: 4, byCategory: [{ category: "helpful_staff", count: 4 }] },
      buses: [{ busNumber: "NB-1", count: 3 }],
    };
    renderWithProviders(<ScorecardView kind="route" card={card} />);

    expect(screen.getByText(/Fewer than 3 checked complaints/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /NB-1/ })).toHaveAttribute("href", "/bus/NB-1");
  });
});
