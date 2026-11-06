import type { Language, ReportCategory } from "@/constants/reportConstants";

// Shapes returned by the public, aggregated endpoints (/api/public/*): totals only, never
// passenger details. Keep in sync with api/src/repositories/public.repository.ts.

export interface CategoryCount {
  category: ReportCategory;
  count: number;
}

export interface HeatmapCell {
  lat: number;
  lng: number;
  count: number;
}

export interface StoryTranslation {
  title: string;
  body: string;
}

export interface PublicStory {
  id: string;
  title: string;
  body: string;
  translations: Partial<Record<Exclude<Language, "en">, StoryTranslation>>;
  category: ReportCategory | null;
  routeNumber: string | null;
  month: string; // "YYYY-MM"
}

export interface PublicImpact {
  updatedAt: string;
  minPublicReports: number;
  totals: {
    received: number;
    receivedThisMonth: number;
    checked: number;
    resolved: number;
    resolvedThisMonth: number;
    resolutionRate: number | null;
    medianHoursToResolve: number | null;
    commendations: number;
    averageRating: number | null;
    ratings: number;
  };
  byMonth: { month: string; received: number; resolved: number }[];
  byCategory: CategoryCount[];
  topRoutes: { routeNumber: string; count: number }[];
  heatmap: { cellDegrees: number; minReports: number; cells: HeatmapCell[] };
  stories: PublicStory[];
}

export interface ScorecardComplaints {
  checked: number;
  resolved: number;
  inProgress: number;
  resolutionRate: number;
  byCategory: CategoryCount[];
  averageRating: number | null;
  byMonth: { month: string; count: number }[];
}

interface ScorecardBase {
  published: boolean;
  minPublicReports: number;
  since: string | null;
  complaints: ScorecardComplaints | null;
  commendations: { count: number; byCategory: CategoryCount[] } | null;
}

export interface BusScorecard extends ScorecardBase {
  busNumber: string;
  busName?: string | null;
  routes?: string[];
}

export interface RouteScorecard extends ScorecardBase {
  routeNumber: string;
  buses?: { busNumber: string; count: number }[];
}

/** Admin view of a story (drafts included) */
export interface Story extends Omit<PublicStory, "month"> {
  reportId: string | null;
  receiptId: string | null;
  published: boolean;
  publishedAt: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export type StoryInput = Pick<
  Story,
  "title" | "body" | "translations" | "category" | "routeNumber" | "reportId" | "published"
>;
