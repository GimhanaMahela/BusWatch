import { screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "@/test/renderWithProviders";
import type { PublicImpact } from "@/types/public";
import ImpactView from "./ImpactView";

// Charts need a real layout engine; the data table behind each chart is what we assert on
vi.mock("@mui/x-charts/BarChart", () => ({ BarChart: () => null }));

const impact: PublicImpact = {
  updatedAt: "2026-11-05T08:00:00.000Z",
  minPublicReports: 3,
  totals: {
    received: 1250,
    receivedThisMonth: 80,
    checked: 900,
    resolved: 612,
    resolvedThisMonth: 41,
    resolutionRate: 68,
    medianHoursToResolve: 30,
    commendations: 57,
    averageRating: 4.2,
    ratings: 120,
  },
  byMonth: [{ month: "2026-11", received: 80, resolved: 41 }],
  byCategory: [{ category: "overcharging", count: 300 }],
  topRoutes: [{ routeNumber: "08", count: 42 }],
  heatmap: {
    cellDegrees: 0.05,
    minReports: 3,
    cells: [{ lat: 7.3, lng: 80.65, count: 12 }],
  },
  stories: [
    {
      id: "s1",
      title: "Route 08 overcharging: refunds issued",
      body: "The operator refunded passengers.",
      translations: {
        si: { title: "මාර්ග 08: මුදල් ආපසු ගෙවීය", body: "හිමිකරු මුදල් ආපසු ගෙවීය." },
      },
      category: "overcharging",
      routeNumber: "08",
      month: "2026-10",
    },
  ],
};

describe("ImpactView", () => {
  it("shows totals, trends, areas, routes and stories", () => {
    renderWithProviders(<ImpactView impact={impact} />);

    expect(screen.getByText("1,250")).toBeInTheDocument();
    expect(screen.getByText("68%")).toBeInTheDocument();
    expect(screen.getByText("30 h")).toBeInTheDocument();
    expect(screen.getByText("4.2 / 5")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Where problems cluster" })).toBeInTheDocument();
    expect(screen.getByText("12 reports near 7.30, 80.65")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /^08/ })).toHaveAttribute("href", "/route/08");
    const story = screen.getByRole("article");
    expect(within(story).getByText("Route 08 overcharging: refunds issued")).toBeInTheDocument();
    expect(within(story).getByText("October 2026")).toBeInTheDocument();
  });

  it("shows stories in the reader's language when translated", () => {
    renderWithProviders(<ImpactView impact={impact} />, { locale: "si" });
    expect(screen.getByText("මාර්ග 08: මුදල් ආපසු ගෙවීය")).toBeInTheDocument();
    expect(screen.queryByText("Route 08 overcharging: refunds issued")).not.toBeInTheDocument();
  });

  it("explains when the figures can't be loaded", () => {
    renderWithProviders(<ImpactView impact={null} />);
    expect(screen.getByText(/can't be loaded right now/)).toBeInTheDocument();
  });
});
