import type {
  AccessibilityIssue,
  AccidentInvolvement,
  BusService,
  Commendee,
  InjuryLevel,
  Language,
  ReportCategory,
  ReportStatus,
  ReportType,
  SafetyKind,
  RoadHazard,
  ServiceClass,
  VehicleKind,
} from "@/constants/reportConstants";

/**
 * A road incident: the vehicle (not for road hazards), and the accident or road problem. `plate`
 * only comes to admins; the tracking page never gets it.
 */
export interface RoadIncidentDetails {
  vehicle?: {
    kind: VehicleKind;
    plate?: string | null;
    colour: string | null;
    make: string | null;
  };
  accident?: {
    involvement: AccidentInvolvement;
    injuries: InjuryLevel;
    vehiclesInvolved: number | null;
  };
  hazard?: RoadHazard;
  /** Anything else wrong with the road there, besides the main problem */
  extraHazards?: RoadHazard[];
}

/** The official fare, worked out by the server from the admins' fare tables */
export interface FareEvidence {
  routeNumber: string;
  routeName: string;
  from: string;
  to: string;
  stages: number;
  serviceClass: ServiceClass;
  officialFare: number;
  chargedFare: number | null;
  effectiveFrom: string | null;
}

/** Structured extras for some categories */
export interface ReportDetails {
  accessibility?: AccessibilityIssue[];
  fare?: FareEvidence;
  /** Filed from the quick safety-mode form */
  safety?: { kinds: SafetyKind[] };
  road?: RoadIncidentDetails;
  /** Commendations: who the passenger is thanking */
  commendee?: Commendee;
}

/** What the browser sends: the fare is only the passenger's choice; the server looks it up */
export interface ReportDetailsInput {
  accessibility?: AccessibilityIssue[];
  fare?: {
    routeId: string;
    from: number;
    to: number;
    serviceClass: ServiceClass;
    charged?: number;
  };
  safety?: { kinds: SafetyKind[] };
  road?: {
    vehicle?: { kind: VehicleKind; plate: string; colour: string; make: string };
    accident?: {
      involvement: AccidentInvolvement;
      injuries: InjuryLevel;
      vehiclesInvolved: number | null;
    };
    hazard?: RoadHazard;
    extraHazards?: RoadHazard[];
  };
  commendee?: Commendee;
}

export interface StatusChange {
  status: ReportStatus;
  note?: string;
  changedBy?: string;
  changedAt: string;
}

export interface InternalNote {
  id: string;
  text: string;
  author?: string;
  createdAt: string;
}

export type MessageSender = "admin" | "passenger";

/** A message on a report's conversation, as admins see it */
export interface ReportMessage {
  id: string;
  sender: MessageSender;
  body: string;
  /** Admin email for team messages */
  author?: string | null;
  createdAt: string;
  readAt?: string | null;
}

/** A message as the passenger sees it: never the admin's name */
export interface PublicMessage {
  id: string;
  sender: MessageSender;
  body: string;
  createdAt: string;
  /** For the passenger's own messages: has the team seen it? */
  read: boolean;
}

/** How a report reached TransitX: the website, its QR sticker link, or the WhatsApp bot */
export type ReportSource = "web" | "qr" | "whatsapp";

/** Which channels reached the passenger after an update */
export interface Delivery {
  email: boolean;
  sms: boolean;
  /** Devices reached by browser push */
  push: number;
  /** Telegram chats reached */
  telegram: number;
  /** WhatsApp numbers reached */
  whatsapp: number;
}

/** A "me too" confirmation from another passenger, as admins see it */
export interface ReportConfirmation {
  id: string;
  comment: string | null;
  language: Language;
  source: ReportSource;
  createdAt: string;
}

export type PartOfDay = "morning" | "afternoon" | "evening" | "night";

/** A complaint about the same bus, category and day, offered to confirm instead of re-reporting */
export interface SimilarReport {
  id: string;
  routeNumber: string;
  /** Only when the original passenger gave an incident time */
  partOfDay: PartOfDay | null;
  confirmations: number;
}

/** What a bus operator said they did about a report (operator portal) */
export interface AdminOperatorResponse {
  id: string;
  body: string;
  organisation: string | null;
  /** Kept off the passenger's tracking page by an admin */
  hidden: boolean;
  createdAt: string;
}

/** AI help for admins: advice only, never shown to passengers */
export interface AiInsights {
  detectedLanguage: "en" | "si" | "ta" | "other";
  englishTranslation: string | null;
  summary: string | null;
  suggestedCategory: ReportCategory;
  categoryConfidence: "low" | "medium" | "high";
  categoryReason: string;
  flags: ("personal_details" | "abusive_language" | "possible_emergency" | "not_a_bus_issue")[];
  model: string;
  generatedAt: string;
}

/** Full report as admins see it */
export interface Report {
  id: string;
  receiptId: string;
  type: ReportType;
  busNumber: string;
  routeNumber: string;
  busName?: string | null;
  busService?: BusService | null;
  category: ReportCategory;
  /** Complaints: the other incident types the passenger ticked (older reports: none) */
  extraCategories?: ReportCategory[];
  location: string | null;
  latitude?: number | null;
  longitude?: number | null;
  description: string;
  images: string[];
  videos: string[];
  incidentAt?: string;
  reportedAt: string;
  passengerEmail?: string;
  passengerPhone?: string | null;
  language: Language;
  source: ReportSource;
  status: ReportStatus;
  statusHistory?: StatusChange[];
  notes?: InternalNote[];
  resolvedAt?: string;
  pdfUrl?: string;
  outcomeRating?: number | null;
  outcomeFeedback?: string | null;
  ratedAt?: string | null;
  hiddenFromPublic?: boolean;
  messages?: ReportMessage[];
  /** Report lists only: passenger messages no admin has read yet */
  unreadMessages?: number;
  /** "Me too" confirmations from other passengers (details page) */
  confirmations?: ReportConfirmation[];
  /** Report lists only: how many other passengers confirmed it */
  confirmationCount?: number;
  /** Responses from the bus operator */
  operatorResponses?: AdminOperatorResponse[];
  aiInsights?: AiInsights | null;
  /** Photos with faces and number plates blurred (what operators see) */
  blurredImages?: string[] | null;
  /** Details page: operator accounts that run this bus */
  operators?: { id: string; email: string; organisation: string | null }[];
  details?: ReportDetails | null;
}

/** What the public tracking endpoint returns */
export interface PublicReport {
  receiptId: string;
  type: ReportType;
  status: ReportStatus;
  category: ReportCategory;
  /** Complaints: the other incident types the passenger ticked */
  extraCategories?: ReportCategory[];
  busNumber: string;
  routeNumber: string;
  busService?: BusService | null;
  location: string | null;
  incidentAt?: string;
  reportedAt: string;
  resolvedAt?: string;
  timeline: { status: ReportStatus; note?: string; changedAt: string }[];
  /** True once a complaint is closed: the passenger may rate how it was handled */
  canRate: boolean;
  rating: number | null;
  feedback: string | null;
  ratedAt: string | null;
  messages: PublicMessage[];
  /** False once the report has been closed for a while */
  canReply: boolean;
  /** Other passengers who confirmed it ("me too") */
  confirmations: number;
  /** What the bus operator said they did */
  operatorResponses: { body: string; organisation: string | null; createdAt: string }[];
  details?: ReportDetails | null;
}

export interface SubmitReportFields {
  type?: ReportType;
  /** Empty for a road incident */
  busNumber: string;
  routeNumber: string;
  busName?: string;
  busService?: BusService | "";
  category: ReportCategory | "";
  /** Complaints: other incident types besides the main one, comma-separated */
  extraCategories?: string;
  incidentAt?: string;
  location?: string;
  latitude?: number | "";
  longitude?: number | "";
  description: string;
  passengerEmail?: string;
  passengerPhone?: string;
  language?: Language;
  source?: ReportSource;
  website?: string;
  /** JSON of ReportDetailsInput (multipart forms send strings) */
  details?: string;
}

export interface SubmitReportResponse {
  msg: string;
  receiptId: string;
  pdfUrl: string | null;
  emailSent: boolean;
  smsSent?: boolean;
  report: PublicReport;
}

export interface ReportListParams {
  page?: number | string;
  limit?: number | string;
  status?: string;
  category?: string;
  type?: ReportType;
  q?: string;
  from?: string;
  to?: string;
}

export interface ReportListResponse {
  reports: Report[];
  total: number;
  page: number;
  pages: number;
}

export interface ReportStats {
  total: number;
  last30Days: number;
  open: number;
  byStatus: Record<ReportStatus, number>;
  byCategory: { category: ReportCategory; count: number }[];
  byMonth: { month: string; count: number }[];
  topRoutes: { routeNumber: string; count: number }[];
  topBuses: { busNumber: string; busName?: string; count: number }[];
  repeatOffenders: { busNumber: string; count: number; lastReportedAt: string }[];
  avgResolutionHours: number | null;
  resolvedWithTiming: number;
  commendations: CommendationStats;
  lostItems: {
    total: number;
    last30Days: number;
    open: number;
    found: number;
    byStatus: Record<ReportStatus, number>;
  };
  /** Any vehicle or the road itself: never part of the bus figures above */
  roadIncidents: {
    total: number;
    last30Days: number;
    open: number;
    seriousInjuries: number;
    byStatus: Record<ReportStatus, number>;
    byCategory: { category: ReportCategory; count: number }[];
    byVehicle: { kind: VehicleKind; count: number }[];
  };
  engagement: EngagementStats;
}

export interface CommendationStats {
  total: number;
  last30Days: number;
  open: number;
  byStatus: Record<ReportStatus, number>;
  byCategory: { category: ReportCategory; count: number }[];
  topBuses: { busNumber: string; busName?: string | null; count: number }[];
}

/** Phase 1 success metrics over the last `periodDays` days */
export interface EngagementStats {
  periodDays: number;
  formStarts: number;
  formSubmits: number;
  formCompletionRate: number | null;
  trackingViews: number;
  trackingReturnViews: number;
  qrScans: number;
  qrReports: number;
  webReports: number;
  shares: number;
  offlineQueued: number;
  appInstalls: number;
  avgFirstResponseHours: number | null;
  respondedReports: number;
  avgRating: number | null;
  ratingsCount: number;
  ratingDistribution: { rating: number; count: number }[];
  recentFeedback: {
    id: string;
    receiptId: string;
    rating: number;
    feedback: string;
    ratedAt: string;
  }[];
  byLanguage: Record<Language, number>;
  // Two-way contact (Phase 3)
  adminMessages: number;
  passengerMessages: number;
  myReportsSignins: number;
  pushSubscriptions: number;
  telegramLinks: number;
  whatsappMessages: number;
  whatsappLinks: number;
  // Wider ecosystem (Phase 4)
  confirmationsOffered: number;
  reportConfirmations: number;
  // Passenger safety (Phase 5)
  faresChecked: number;
  safetyReports: number;
  tripsShared: number;
  emergencyShown: number;
  roadIncidents: number;
}

/** A report in "My reports" */
export interface PassengerReportSummary {
  receiptId: string;
  type: ReportType;
  status: ReportStatus;
  category: ReportCategory;
  busNumber: string;
  routeNumber: string;
  reportedAt: string;
  resolvedAt: string | null;
  lastUpdateAt: string;
  /** Team messages the passenger hasn't read */
  unreadMessages: number;
}

export interface PassengerContactInfo {
  channel: "email" | "phone";
  /** Masked, e.g. "ka***@gmail.com" or "+9477***4567" */
  display: string;
}
