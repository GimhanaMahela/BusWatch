// Fixed reference data for the development seed (npm run db:seed): places, routes, buses, the
// people who use the admin and operator portals, and the words passengers and admins write.
// Everything here is made up for local development and demos. Bus numbers, names, companies and
// contact details are fictional; e-mail addresses use the reserved example.com domain.
//
// The fare tables are illustrative only, NOT the official NTC fares: replace them in
// Admin → Fares before relying on the fare checker.

import type {
  AccessibilityIssue,
  BusService,
  Commendee,
  ReportCategory,
  ServiceClass,
} from "../../config/constants.js";
import type { StoryTranslations } from "../schema.js";

// ---------------------------------------------------------------- Places

/** Approximate coordinates of towns and junctions on the seeded routes. */
export const PLACES = {
  Pettah: [6.9344, 79.8508],
  Kollupitiya: [6.911, 79.849],
  "Town Hall": [6.9157, 79.8636],
  Thimbirigasyaya: [6.895, 79.871],
  Bambalapitiya: [6.893, 79.856],
  Wellawatte: [6.8741, 79.8606],
  Dehiwala: [6.851, 79.865],
  "Mount Lavinia": [6.839, 79.8656],
  Ratmalana: [6.82, 79.88],
  Moratuwa: [6.773, 79.8816],
  Panadura: [6.7132, 79.9026],
  Wadduwa: [6.667, 79.929],
  Kalutara: [6.5854, 79.9607],
  Beruwala: [6.4788, 79.9828],
  Aluthgama: [6.434, 80.003],
  Bentota: [6.425, 80.0],
  Ambalangoda: [6.2355, 80.0538],
  Hikkaduwa: [6.1395, 80.1063],
  Galle: [6.0535, 80.221],
  Unawatuna: [6.01, 80.249],
  Weligama: [5.9747, 80.4297],
  Matara: [5.9549, 80.555],
  Kelaniya: [6.9553, 79.922],
  Kiribathgoda: [6.98, 79.929],
  Kadawatha: [7.0012, 79.953],
  Miriswatte: [7.0716, 80.0155],
  Nittambuwa: [7.1442, 80.096],
  Pasyala: [7.17, 80.13],
  Ambepussa: [7.2445, 80.1765],
  Warakapola: [7.2253, 80.1972],
  Kegalle: [7.2513, 80.3464],
  Mawanella: [7.2525, 80.4467],
  Kadugannawa: [7.2545, 80.5243],
  Peradeniya: [7.269, 80.5942],
  Kandy: [7.2906, 80.6337],
  Alawwa: [7.293, 80.24],
  Polgahawela: [7.3333, 80.3],
  Kurunegala: [7.4863, 80.3647],
  Wattala: [6.9897, 79.8915],
  "Ja-Ela": [7.0744, 79.8919],
  Katunayake: [7.17, 79.884],
  Negombo: [7.2083, 79.8358],
  Kochchikade: [7.26, 79.858],
  Marawila: [7.4097, 79.8317],
  Chilaw: [7.5758, 79.7953],
  Puttalam: [8.0362, 79.8283],
  Dambulla: [7.8742, 80.6511],
  Anuradhapura: [8.3114, 80.4037],
  Medawachchiya: [8.538, 80.495],
  Vavuniya: [8.7514, 80.4971],
  Kilinochchi: [9.3803, 80.377],
  "Elephant Pass": [9.56, 80.41],
  Jaffna: [9.6615, 80.0255],
  Kopay: [9.703, 80.064],
  Puttur: [9.73, 80.13],
  Nelliady: [9.806, 80.196],
  "Point Pedro": [9.8167, 80.2333],
  Kirulapone: [6.879, 79.878],
  Nugegoda: [6.8649, 79.8997],
  Delkanda: [6.86, 79.908],
  Navinna: [6.851, 79.92],
  Maharagama: [6.848, 79.9265],
  Pannipitiya: [6.846, 79.95],
  Kottawa: [6.841, 79.965],
  Homagama: [6.8441, 80.0024],
  Borella: [6.9147, 79.8778],
  Rajagiriya: [6.909, 79.896],
  Battaramulla: [6.901, 79.918],
  Malabe: [6.904, 79.958],
  Kaduwela: [6.935, 79.984],
  Boralesgamuwa: [6.84, 79.901],
  Piliyandala: [6.8018, 79.9227],
  Kesbewa: [6.7953, 79.9405],
  Bandaragama: [6.714, 79.987],
  Horana: [6.7159, 80.0626],
  Makumbura: [6.839, 79.985],
  Kahathuduwa: [6.784, 80.0],
} as const satisfies Record<string, readonly [number, number]>;

export type PlaceName = keyof typeof PLACES;

// ---------------------------------------------------------------- Routes

export interface SeedRoute {
  routeNumber: string;
  name: string;
  /** Halts in order, with their fare stage (used when the route is in the fare checker) */
  stops: readonly (readonly [PlaceName, number])[];
  /** Added to the fare checker with these classes; null keeps it out */
  fareClasses: readonly ServiceClass[] | null;
}

export const ROUTES = [
  {
    routeNumber: "01",
    name: "Colombo - Kandy",
    fareClasses: ["normal", "semi_luxury", "luxury"],
    stops: [
      ["Pettah", 1],
      ["Kelaniya", 4],
      ["Kiribathgoda", 5],
      ["Kadawatha", 8],
      ["Miriswatte", 12],
      ["Nittambuwa", 17],
      ["Pasyala", 20],
      ["Ambepussa", 23],
      ["Warakapola", 25],
      ["Kegalle", 32],
      ["Mawanella", 36],
      ["Kadugannawa", 40],
      ["Peradeniya", 43],
      ["Kandy", 45],
    ],
  },
  {
    routeNumber: "02",
    name: "Colombo - Matara",
    fareClasses: ["normal", "semi_luxury"],
    stops: [
      ["Pettah", 1],
      ["Kollupitiya", 2],
      ["Wellawatte", 4],
      ["Dehiwala", 5],
      ["Mount Lavinia", 6],
      ["Moratuwa", 9],
      ["Panadura", 12],
      ["Wadduwa", 14],
      ["Kalutara", 18],
      ["Beruwala", 23],
      ["Aluthgama", 25],
      ["Bentota", 27],
      ["Ambalangoda", 34],
      ["Hikkaduwa", 39],
      ["Galle", 46],
      ["Unawatuna", 48],
      ["Weligama", 55],
      ["Matara", 60],
    ],
  },
  {
    routeNumber: "04",
    name: "Colombo - Puttalam",
    fareClasses: ["normal"],
    stops: [
      ["Pettah", 1],
      ["Wattala", 3],
      ["Ja-Ela", 7],
      ["Katunayake", 10],
      ["Negombo", 13],
      ["Kochchikade", 16],
      ["Marawila", 21],
      ["Chilaw", 28],
      ["Puttalam", 45],
    ],
  },
  {
    routeNumber: "05",
    name: "Colombo - Kurunegala",
    fareClasses: ["normal", "semi_luxury"],
    stops: [
      ["Pettah", 1],
      ["Kelaniya", 4],
      ["Kiribathgoda", 5],
      ["Kadawatha", 8],
      ["Nittambuwa", 17],
      ["Pasyala", 20],
      ["Ambepussa", 23],
      ["Alawwa", 27],
      ["Polgahawela", 31],
      ["Kurunegala", 38],
    ],
  },
  {
    routeNumber: "87",
    name: "Colombo - Jaffna",
    fareClasses: ["normal", "semi_luxury", "luxury"],
    stops: [
      ["Pettah", 1],
      ["Kurunegala", 38],
      ["Dambulla", 68],
      ["Anuradhapura", 93],
      ["Medawachchiya", 104],
      ["Vavuniya", 117],
      ["Kilinochchi", 149],
      ["Elephant Pass", 157],
      ["Jaffna", 171],
    ],
  },
  {
    routeNumber: "100",
    name: "Pettah - Panadura",
    fareClasses: null,
    stops: [
      ["Pettah", 1],
      ["Kollupitiya", 2],
      ["Bambalapitiya", 3],
      ["Wellawatte", 4],
      ["Dehiwala", 5],
      ["Mount Lavinia", 6],
      ["Ratmalana", 7],
      ["Moratuwa", 9],
      ["Panadura", 12],
    ],
  },
  {
    routeNumber: "120",
    name: "Pettah - Horana",
    fareClasses: null,
    stops: [
      ["Pettah", 1],
      ["Kirulapone", 4],
      ["Boralesgamuwa", 6],
      ["Piliyandala", 8],
      ["Kesbewa", 9],
      ["Bandaragama", 13],
      ["Horana", 17],
    ],
  },
  {
    routeNumber: "138",
    name: "Pettah - Homagama",
    fareClasses: ["normal"],
    stops: [
      ["Pettah", 1],
      ["Town Hall", 2],
      ["Thimbirigasyaya", 3],
      ["Kirulapone", 4],
      ["Nugegoda", 5],
      ["Delkanda", 6],
      ["Navinna", 7],
      ["Maharagama", 8],
      ["Pannipitiya", 9],
      ["Kottawa", 10],
      ["Homagama", 12],
    ],
  },
  {
    routeNumber: "177",
    name: "Kollupitiya - Kaduwela",
    fareClasses: null,
    stops: [
      ["Kollupitiya", 1],
      ["Borella", 3],
      ["Rajagiriya", 4],
      ["Battaramulla", 5],
      ["Malabe", 7],
      ["Kaduwela", 9],
    ],
  },
  {
    routeNumber: "750",
    name: "Jaffna - Point Pedro",
    fareClasses: null,
    stops: [
      ["Jaffna", 1],
      ["Kopay", 3],
      ["Puttur", 6],
      ["Nelliady", 9],
      ["Point Pedro", 11],
    ],
  },
  {
    routeNumber: "EX-1",
    name: "Makumbura - Matara (Expressway)",
    fareClasses: null,
    stops: [
      ["Makumbura", 1],
      ["Kahathuduwa", 2],
      ["Galle", 10],
      ["Matara", 14],
    ],
  },
] as const satisfies readonly SeedRoute[];

export type RouteNumber = (typeof ROUTES)[number]["routeNumber"];

// ---------------------------------------------------------------- Fare tables

/**
 * An illustrative fare-stage table: Rs. 27 for one stage, rising by a little less each stage.
 * Semi-luxury and luxury are 1.5x and 2x the normal fare. Not the official NTC table.
 */
export const buildFareTable = (serviceClass: ServiceClass, stages = 200): number[] => {
  const multiplier = { normal: 1, semi_luxury: 1.5, luxury: 2 }[serviceClass];
  return Array.from({ length: stages }, (_, i) => {
    const normal = 27 + 7.6 * i - 0.012 * i * i;
    return Math.round(normal * multiplier);
  });
};

export const FARE_TABLE_EFFECTIVE_FROM = "2025-07-01";

// ---------------------------------------------------------------- People

/** Default password for every seeded account (override with SEED_PASSWORD). */
export const DEFAULT_SEED_PASSWORD = "TransitX-dev-2026";

export const STAFF = [
  { email: "superadmin@example.com", role: "superadmin" },
  { email: "admin@example.com", role: "admin" },
  { email: "moderator@example.com", role: "admin" },
] as const;

export type OperatorKey = "ruhunu" | "kandyRoad" | "sltbMaharagama" | "northern" | "metro";

export const OPERATORS: readonly { key: OperatorKey; email: string; organisation: string }[] = [
  {
    key: "ruhunu",
    email: "operator.ruhunu@example.com",
    organisation: "Ruhunu Express Transport (Pvt) Ltd",
  },
  {
    key: "kandyRoad",
    email: "operator.kandyroad@example.com",
    organisation: "Kandy Road Passenger Services",
  },
  {
    key: "sltbMaharagama",
    email: "operator.sltb@example.com",
    organisation: "SLTB Maharagama Depot",
  },
  { key: "northern", email: "operator.northern@example.com", organisation: "Northern Coach Lines" },
  // An operator account with no buses yet: shows the empty portal
  { key: "metro", email: "operator.metro@example.com", organisation: "Metro Bus Lanka" },
];

/**
 * How a bus tends to be talked about: "poor" buses draw mostly complaints, "good" ones mostly
 * thanks. Weight is how often passengers report on it at all.
 */
export type BusProfile = "poor" | "mixed" | "good";

export interface SeedBus {
  busNumber: string;
  routeNumber: RouteNumber;
  busService: BusService;
  busName: string | null;
  operator: OperatorKey | null;
  profile: BusProfile;
  weight: number;
  serviceClass: ServiceClass;
}

export const BUSES: readonly SeedBus[] = [
  // Colombo - Kandy
  {
    busNumber: "NA-6612",
    routeNumber: "01",
    busService: "private",
    busName: "Kandy Queen",
    operator: "kandyRoad",
    profile: "poor",
    weight: 9,
    serviceClass: "normal",
  },
  {
    busNumber: "NB-9034",
    routeNumber: "01",
    busService: "private",
    busName: "Sisila",
    operator: "kandyRoad",
    profile: "good",
    weight: 6,
    serviceClass: "semi_luxury",
  },
  {
    busNumber: "ND-5520",
    routeNumber: "01",
    busService: "private",
    busName: "Hill Country Express",
    operator: "kandyRoad",
    profile: "mixed",
    weight: 5,
    serviceClass: "luxury",
  },
  {
    busNumber: "NC-3401",
    routeNumber: "01",
    busService: "sltb",
    busName: null,
    operator: null,
    profile: "mixed",
    weight: 3,
    serviceClass: "normal",
  },
  // Colombo - Matara
  {
    busNumber: "NB-4521",
    routeNumber: "02",
    busService: "private",
    busName: "Ruhunu Kumari",
    operator: "ruhunu",
    profile: "poor",
    weight: 10,
    serviceClass: "normal",
  },
  {
    busNumber: "ND-3318",
    routeNumber: "02",
    busService: "private",
    busName: "Nilwala",
    operator: "ruhunu",
    profile: "good",
    weight: 6,
    serviceClass: "semi_luxury",
  },
  {
    busNumber: "NB-1290",
    routeNumber: "02",
    busService: "private",
    busName: "Sea Breeze",
    operator: "ruhunu",
    profile: "mixed",
    weight: 4,
    serviceClass: "normal",
  },
  {
    busNumber: "NA-7720",
    routeNumber: "02",
    busService: "sltb",
    busName: null,
    operator: null,
    profile: "mixed",
    weight: 3,
    serviceClass: "normal",
  },
  // Expressway
  {
    busNumber: "NC-7742",
    routeNumber: "EX-1",
    busService: "private",
    busName: "Southern Highway Express",
    operator: "ruhunu",
    profile: "good",
    weight: 4,
    serviceClass: "luxury",
  },
  {
    busNumber: "ND-1120",
    routeNumber: "EX-1",
    busService: "private",
    busName: null,
    operator: null,
    profile: "mixed",
    weight: 2,
    serviceClass: "luxury",
  },
  // Colombo - Kurunegala
  {
    busNumber: "NB-5560",
    routeNumber: "05",
    busService: "private",
    busName: "Wayamba Star",
    operator: null,
    profile: "poor",
    weight: 7,
    serviceClass: "normal",
  },
  {
    busNumber: "NA-2205",
    routeNumber: "05",
    busService: "sltb",
    busName: null,
    operator: null,
    profile: "mixed",
    weight: 3,
    serviceClass: "normal",
  },
  // Colombo - Puttalam
  {
    busNumber: "NC-0412",
    routeNumber: "04",
    busService: "private",
    busName: "Lagoon Express",
    operator: null,
    profile: "mixed",
    weight: 4,
    serviceClass: "normal",
  },
  {
    busNumber: "NB-8823",
    routeNumber: "04",
    busService: "private",
    busName: null,
    operator: null,
    profile: "poor",
    weight: 3,
    serviceClass: "normal",
  },
  // Colombo - Jaffna
  {
    busNumber: "NP-8701",
    routeNumber: "87",
    busService: "private",
    busName: "Nallur Express",
    operator: "northern",
    profile: "good",
    weight: 5,
    serviceClass: "luxury",
  },
  {
    busNumber: "NP-8722",
    routeNumber: "87",
    busService: "private",
    busName: "Northern Star",
    operator: "northern",
    profile: "mixed",
    weight: 4,
    serviceClass: "semi_luxury",
  },
  // Jaffna - Point Pedro
  {
    busNumber: "62-7501",
    routeNumber: "750",
    busService: "sltb",
    busName: null,
    operator: null,
    profile: "mixed",
    weight: 3,
    serviceClass: "normal",
  },
  // Pettah - Homagama
  {
    busNumber: "NB-2245",
    routeNumber: "138",
    busService: "sltb",
    busName: null,
    operator: "sltbMaharagama",
    profile: "poor",
    weight: 9,
    serviceClass: "normal",
  },
  {
    busNumber: "ND-8810",
    routeNumber: "138",
    busService: "sltb",
    busName: null,
    operator: "sltbMaharagama",
    profile: "mixed",
    weight: 5,
    serviceClass: "normal",
  },
  {
    busNumber: "NB-1381",
    routeNumber: "138",
    busService: "private",
    busName: "Kottawa Express",
    operator: null,
    profile: "poor",
    weight: 6,
    serviceClass: "normal",
  },
  // Pettah - Horana
  {
    busNumber: "NA-4471",
    routeNumber: "120",
    busService: "sltb",
    busName: null,
    operator: "sltbMaharagama",
    profile: "mixed",
    weight: 4,
    serviceClass: "normal",
  },
  {
    busNumber: "NC-1206",
    routeNumber: "120",
    busService: "private",
    busName: "Horana Star",
    operator: null,
    profile: "poor",
    weight: 4,
    serviceClass: "normal",
  },
  // Kollupitiya - Kaduwela (Metro Bus)
  {
    busNumber: "NC-1770",
    routeNumber: "177",
    busService: "metro",
    busName: null,
    operator: null,
    profile: "good",
    weight: 4,
    serviceClass: "normal",
  },
  {
    busNumber: "NC-1771",
    routeNumber: "177",
    busService: "metro",
    busName: null,
    operator: null,
    profile: "mixed",
    weight: 2,
    serviceClass: "normal",
  },
  // Pettah - Panadura
  {
    busNumber: "62-3378",
    routeNumber: "100",
    busService: "sltb",
    busName: null,
    operator: "sltbMaharagama",
    profile: "mixed",
    weight: 4,
    serviceClass: "normal",
  },
  {
    busNumber: "NB-1002",
    routeNumber: "100",
    busService: "private",
    busName: "Galle Road Flyer",
    operator: null,
    profile: "poor",
    weight: 5,
    serviceClass: "normal",
  },
];

/** Passenger contact details. example.com is reserved, so nothing is ever delivered. */
export const PASSENGER_EMAILS = [
  "passenger.demo@example.com",
  "nimal.perera@example.com",
  "kavindi.s@example.com",
  "tharshan.k@example.com",
  "fathima.rizwan@example.com",
  "dilan.j@example.com",
  "sanduni.w@example.com",
  "priya.n@example.com",
  "ashan.f@example.com",
  "mohamed.n@example.com",
  "ishara.b@example.com",
  "kumaran.s@example.com",
];

/**
 * Phone numbers for "My reports" by SMS. SMS_PROVIDER defaults to "none", so nothing is sent;
 * if you turn an SMS provider on, don't change seeded reports' statuses (that would text them).
 */
export const PASSENGER_PHONES = ["+94710000101", "+94710000102", "+94710000103", "+94710000104"];

// ---------------------------------------------------------------- What passengers write

type Lang = "en" | "si" | "ta";

export interface SeedText {
  lang: Lang;
  text: string;
  /** English translation for Sinhala and Tamil (goes in the AI insights) */
  english?: string;
}

const en = (text: string): SeedText => ({ lang: "en", text });
const si = (text: string, english: string): SeedText => ({ lang: "si", text, english });
const ta = (text: string, english: string): SeedText => ({ lang: "ta", text, english });

// {place} is the stop, {route} the route number, {bus} the bus number
export const COMPLAINT_TEXTS: Partial<Record<ReportCategory, SeedText[]>> = {
  reckless_driving: [
    en(
      "The driver was racing another bus on route {route} near {place}, overtaking on a bend with oncoming traffic. Passengers standing in the aisle were thrown around.",
    ),
    en(
      "Driver was using his phone while driving and braked very hard twice near {place}. An elderly passenger fell on the steps.",
    ),
    en(
      "Bus was going far too fast through {place} town in the rain. It nearly hit a three-wheeler at the junction.",
    ),
    si(
      "බස් රියදුරු ඉතා වේගයෙන් පදවමින් අනෙක් වාහන හරහා භයානක ලෙස ඉස්සර කළා. මගීන් කිහිප දෙනෙක් වැටෙන්න ගියා.",
      "The bus driver drove very fast and overtook other vehicles dangerously. Several passengers nearly fell.",
    ),
    ta(
      "ஓட்டுநர் மிக வேகமாக ஓட்டி, ஆபத்தான முறையில் மற்ற வாகனங்களை முந்திச் சென்றார்.",
      "The driver drove very fast and overtook other vehicles in a dangerous way.",
    ),
  ],
  overcharging: [
    en(
      "The conductor charged me Rs. {charged} from {from} to {to}. The fare checker says it should be Rs. {official}. He refused to give change.",
    ),
    en(
      "Charged more than the official fare from {from} to {to} and no ticket was given when I asked.",
    ),
    en("The conductor charged more than the fare on the board and refused to give a ticket."),
    si(
      "කොන්දොස්තර නියමිත ගාස්තුවට වඩා වැඩිපුර අය කළා. ටිකට් පතක් ඉල්ලුවත් දුන්නේ නැහැ.",
      "The conductor charged more than the official fare. He did not give a ticket even when asked.",
    ),
    ta(
      "நடத்துநர் உரிய கட்டணத்தை விட அதிகமாக வசூலித்தார். டிக்கெட் தரவில்லை.",
      "The conductor charged more than the proper fare. He did not give a ticket.",
    ),
  ],
  no_ticket: [
    en(
      "No tickets were issued to anyone on this bus. The conductor took cash and said the machine was broken.",
    ),
    en("Asked for a ticket at {place} and the conductor laughed and walked away."),
  ],
  refused_to_stop: [
    en(
      "Waited at the {place} halt with three other people. The bus slowed down, saw us and drove past even though it was half empty.",
    ),
    en(
      "The bus would not stop at {place} for school children in uniform. This happens every morning around 7am.",
    ),
    si(
      "නැවතුමේ බොහෝ වේලාවක් සිටියත් බස් එක නවත්වන්නේ නැතිව ගියා.",
      "Even though I waited at the stop for a long time, the bus went past without stopping.",
    ),
  ],
  harassment: [
    en(
      "A man standing next to me kept pressing against me deliberately between {place} and the next stop. When I complained the conductor did nothing.",
    ),
    en(
      "The conductor made inappropriate comments to a group of schoolgirls and would not stop when asked.",
    ),
  ],
  overcrowding: [
    en(
      "The bus was so full that people were hanging from the door all the way from {place}. The conductor kept letting more people on.",
    ),
    ta(
      "பேருந்து மிகவும் நெரிசலாக இருந்தது, கதவில் தொங்கிக்கொண்டு பயணிகள் சென்றனர்.",
      "The bus was very crowded and passengers were travelling hanging from the door.",
    ),
  ],
  loud_music: [
    en(
      "Music and videos were played extremely loudly the whole journey. When I asked them to turn it down the driver turned it up.",
    ),
    ta(
      "பேருந்தில் மிகவும் சத்தமாக பாடல்கள் ஒலித்தன, குறைக்கச் சொன்னபோதும் மறுத்தனர்.",
      "Songs were played very loudly on the bus and they refused when asked to turn it down.",
    ),
  ],
  vehicle_condition: [
    en(
      "Black smoke was coming into the bus through the floor near the back seats. Several seats are broken and the door doesn't close.",
    ),
    en(
      "The bus broke down near {place} and we waited 40 minutes. The tyres looked completely bald.",
    ),
  ],
  staff_behaviour: [
    en("The conductor shouted at an old woman for being slow to get on and used abusive language."),
    en(
      "Driver and conductor were arguing with passengers and threw a passenger's bag out at {place}.",
    ),
    si(
      "කොන්දොස්තර මගීන්ට අසභ්‍ය වචනයෙන් බැන්නා.",
      "The conductor scolded passengers using obscene words.",
    ),
  ],
  accessibility: [
    en(
      "I use a walking stick and nobody would give up the priority seat. The conductor told me to stand at the back.",
    ),
    en(
      "The bus did not wait for my father in his wheelchair at {place}; it drove off while I was folding the chair.",
    ),
  ],
  other: [
    en(
      "The bus left the depot 25 minutes late and skipped half the route, turning back at {place}.",
    ),
  ],
};

export const SAFETY_DESCRIPTIONS: SeedText[] = [
  en("A passenger kept staring and followed me when I got off at {place}. I felt unsafe."),
  en("Someone was filming women on the bus with his phone. I didn't want to confront him."),
];

export const COMMENDATION_TEXTS: Partial<Record<ReportCategory, SeedText[]>> = {
  safe_driving: [
    en(
      "The driver drove very carefully in heavy rain on the {route} route and waited for everyone to sit before moving. Thank you!",
    ),
    en(
      "Smooth, calm driving all the way from {place}. Never felt rushed. More drivers should be like this.",
    ),
    ta(
      "ஓட்டுநர் மிகவும் கவனமாகவும் பாதுகாப்பாகவும் ஓட்டினார். நன்றி.",
      "The driver drove very carefully and safely. Thank you.",
    ),
  ],
  helpful_staff: [
    en("The conductor helped me find my stop and carried my bags down at {place}. Very kind."),
    si(
      "කොන්දොස්තර මහතා වයසක මගියෙකුට බස් එකට නගින්න උදව් කළා. ඉතා කාරුණික සේවයක්.",
      "The conductor helped an elderly passenger board the bus. Very kind service.",
    ),
  ],
  helped_passenger: [
    en(
      "A passenger fainted near {place} and the crew stopped, gave her water and drove her to the hospital.",
    ),
    en("The conductor stopped two men who were bothering a young woman and made them get off."),
  ],
  clean_vehicle: [en("Spotless bus, clean seats and windows. A pleasure to travel on.")],
  on_time: [en("Left {place} exactly on time every morning this week. Reliable service.")],
  fair_fare: [en("The conductor gave everyone a ticket and the right change, even small coins.")],
  comfortable_service: [
    en("Comfortable seats, working fans and no loud music. Excellent service on route {route}."),
  ],
  other: [en("Thank you to the crew for a pleasant journey.")],
};

export const COMMENDEE_FOR: Partial<Record<ReportCategory, readonly Commendee[]>> = {
  safe_driving: ["driver"],
  helpful_staff: ["conductor", "crew"],
  helped_passenger: ["crew", "conductor"],
  clean_vehicle: ["service"],
  on_time: ["service", "driver"],
  fair_fare: ["conductor"],
  comfortable_service: ["service"],
  other: ["crew"],
};

export const LOST_ITEM_TEXTS: Partial<Record<ReportCategory, string[]>> = {
  bag: [
    "Left a black backpack with a laptop and charger on the rear seat when I got off at {place}.",
  ],
  phone: ["Lost a blue Samsung phone in a clear case, probably fell from my pocket near {place}."],
  wallet: [
    "Brown leather wallet with my NIC and bank cards. I sat near the door and got off at {place}.",
  ],
  documents: [
    "A plastic file with my child's school certificates and birth certificate, left on the seat.",
  ],
  keys: ["A bunch of house keys with a red keytag, left near the driver's seat."],
  clothing: ["A grey school sweater with a name tag, left on the bus after school."],
  other: ["A small umbrella and a lunch box in a cloth bag, left on the overhead rack."],
};

export const ACCESSIBILITY_SETS: readonly AccessibilityIssue[][] = [
  ["priority_seat"],
  ["passed_by", "no_help_boarding"],
  ["high_step", "rushed"],
  ["no_space_mobility_aid", "passed_by"],
];

// ---------------------------------------------------------------- Road incidents

export const ROAD_TEXTS: Partial<Record<ReportCategory, string[]>> = {
  reckless_driving: ["A car was weaving between lanes at high speed near {place}."],
  speeding: ["Lorry going well over the limit through {place} town, past the school."],
  drunk_driving: ["Driver of this van was clearly drunk, swerving all over the road near {place}."],
  red_light: [
    "Drove straight through a red light at the {place} junction, pedestrians had to jump back.",
  ],
  wrong_side: ["Motorcycle riding on the wrong side of the road against traffic near {place}."],
  dangerous_overtaking: ["Overtook three vehicles on a blind bend before {place}."],
  phone_while_driving: ["Three-wheeler driver texting on his phone while driving with passengers."],
  no_helmet: ["Rider and pillion passenger with no helmets, a child sitting in front."],
  road_rage: ["Driver got out and threatened another motorist with a stick at {place}."],
  unsafe_load: ["Tipper carrying sand with no cover, sand flying onto motorcyclists behind."],
  smoke_emission: ["Thick black smoke from this lorry's exhaust the whole way to {place}."],
  noisy_exhaust: ["Motorcycle with a modified exhaust racing up and down the road at night."],
  illegal_parking: [
    "Van parked across the bus halt at {place} every morning so buses stop in the road.",
  ],
  hit_and_run: ["A car hit a motorcyclist near {place} and drove off without stopping."],
  accident: ["A lorry and a three-wheeler collided at the {place} junction."],
  road_hazard: ["Hazard on the main road at {place}, dangerous especially at night."],
  other: ["Something on the road near {place} that the authorities should look at."],
};

export const PLATES = [
  "WP CAB-4512",
  "WP KX-2231",
  "WP BHE-4410",
  "SP CAR-7781",
  "65-4521",
  "WP LM-0098",
  "CP PH-3321",
  "WP CA?-12",
  "NW LJ-5520",
  "WP QB-9014",
];
export const VEHICLE_LOOKS = [
  { colour: "White", make: "Toyota" },
  { colour: "Red", make: "Bajaj" },
  { colour: "Silver", make: "Suzuki" },
  { colour: "Black", make: "Honda" },
  { colour: "Blue", make: "Isuzu" },
  { colour: "Green", make: "TVS" },
  { colour: null, make: null },
];

// ---------------------------------------------------------------- What admins and operators write

export const PUBLIC_NOTES = {
  reviewed: [
    "We've checked your report and passed it on to the bus operator.",
    "Thanks for the details. We've verified this and contacted the operator.",
    null,
  ],
  escalated: [
    "Escalated to the National Transport Commission for further action.",
    "We've raised this with the Provincial Road Passenger Transport Authority.",
  ],
  resolved: [
    "The operator has warned the crew and will monitor this bus. Thank you for reporting.",
    "The driver has been suspended for a week and will be retrained. Thank you.",
    "The operator has refunded the overcharged passengers and reminded conductors to issue tickets.",
    "This has been dealt with. The crew have been given a formal warning.",
  ],
  rejected: [
    "We couldn't confirm this report with the details given. Please include the bus number and time if it happens again.",
    "This bus wasn't running on that route at the time reported.",
  ],
} as const;

export const COMMENDATION_NOTES = {
  reviewed: ["Thank you! We've passed your kind words on to the operator."],
  resolved: ["Your thanks have been shared with the crew. They were very pleased to hear it."],
} as const;

export const LOST_ITEM_NOTES = {
  reviewed: ["We've asked the operator and the depot to look for your item."],
  resolved: [
    "Good news: the conductor found your item. You can collect it from the depot office with your NIC.",
  ],
  rejected: ["Unfortunately the item wasn't found on the bus or at the depot."],
} as const;

export const ROAD_NOTES = {
  reviewed: ["Passed on to the Traffic Police division for the area."],
  escalated: ["Escalated to the Road Development Authority."],
  resolved: [
    "The police have taken action against the driver. Thank you for reporting.",
    "The Road Development Authority has repaired this.",
  ],
  rejected: ["We couldn't identify the vehicle from the details given."],
} as const;

export const INTERNAL_NOTES = [
  "Called the operator's office, they confirmed the crew on duty that day.",
  "Same bus has two other complaints this month. Keep an eye on it.",
  "Passenger sounded credible on the phone. Waiting for the operator's reply.",
  "Checked the timetable: bus was on this route at the stated time.",
  "Possible duplicate of an earlier report, but different day.",
  "Forwarded the dashcam clip to the NTC investigations unit.",
];

export const CONVERSATIONS: readonly (readonly [string, string])[] = [
  [
    "Thanks for reporting this. Do you remember roughly what time you boarded the bus?",
    "Around 7.45 in the morning, at {place}.",
  ],
  [
    "Did you get a ticket? If so, could you tell us the amount printed on it?",
    "No, he didn't give me a ticket.",
  ],
  [
    "Could you describe the conductor or driver so the operator can identify them?",
    "Tall, wearing a blue shirt, about 40 years old.",
  ],
  [
    "Were there other passengers who saw this happen?",
    "Yes, the whole bus saw it. A few people shouted at the driver.",
  ],
];

export const OPERATOR_RESPONSES = [
  "We have spoken to the driver and given a written warning. This bus is now under supervision.",
  "The conductor has been suspended for a week. We apologise to the passenger.",
  "All our conductors have been reminded to issue tickets for every fare.",
  "We have checked the GPS records and the bus did skip the halt. The driver has been warned.",
  "Thank you for letting us know. The vehicle has been sent for a full service.",
];

export const CONFIRMATION_COMMENTS = [
  "I was on the same bus, this is true.",
  "Happened to me too on the same morning.",
  "Same bus does this every day.",
  null,
  null,
  null,
];

// ---------------------------------------------------------------- Impact stories

export interface SeedStory {
  category: ReportCategory;
  routeNumber: RouteNumber | null;
  title: string;
  body: string;
  translations: StoryTranslations;
  published: boolean;
  daysAgo: number;
}

export const STORIES: readonly SeedStory[] = [
  {
    category: "overcharging",
    routeNumber: "138",
    title: "Route 138: refunds after overcharging reports",
    body: "Several passengers reported being charged above the official fare between Nugegoda and Maharagama. The depot checked the ticket records, refunded the passengers who came forward and now spot-checks fares every week.",
    translations: {
      si: {
        title: "138 මාර්ගය: වැඩිපුර ගාස්තු අය කිරීම් නිසා මුදල් ආපසු දෙයි",
        body: "නුගේගොඩ සහ මහරගම අතර නියමිත ගාස්තුවට වඩා අය කළ බව මගීන් කිහිප දෙනෙක් වාර්තා කළා. ඩිපෝව ටිකට් වාර්තා පරීක්ෂා කර මගීන්ට මුදල් ආපසු ලබා දුන්නා.",
      },
      ta: {
        title: "வழித்தடம் 138: அதிக கட்டண புகார்களுக்குப் பின் பணம் திருப்பி வழங்கப்பட்டது",
        body: "நுகேகொட மற்றும் மகரகம இடையே அதிக கட்டணம் வசூலிக்கப்பட்டதாக பல பயணிகள் புகார் அளித்தனர். டிப்போ டிக்கெட் பதிவுகளைச் சரிபார்த்து பயணிகளுக்கு பணத்தைத் திருப்பி வழங்கியது.",
      },
    },
    published: true,
    daysAgo: 6,
  },
  {
    category: "reckless_driving",
    routeNumber: "02",
    title: "Route 02 driver retrained after dangerous overtaking",
    body: "After passengers and a dashcam clip showed a bus racing another on the Galle Road, the operator suspended the driver for a week and sent him on a defensive driving course.",
    translations: {
      si: {
        title: "භයානක ලෙස ඉස්සර කළ 02 මාර්ගයේ රියදුරුට නැවත පුහුණුව",
        body: "ගාලු පාරේ බස් රථයක් තවත් බසයක් සමඟ තරඟ කරන බව මගීන් වාර්තා කළ පසු, ක්‍රියාකරු රියදුරු සතියකට සේවයෙන් ඉවත් කර පුහුණු පාඨමාලාවකට යොමු කළා.",
      },
      ta: {
        title: "ஆபத்தான முந்துதலுக்குப் பின் வழித்தடம் 02 ஓட்டுநருக்கு மீண்டும் பயிற்சி",
        body: "காலி வீதியில் ஒரு பேருந்து மற்றொன்றுடன் போட்டியிட்டதாக பயணிகள் புகார் அளித்த பின், இயக்குநர் ஓட்டுநரை ஒரு வாரம் இடைநிறுத்தி பயிற்சிக்கு அனுப்பினார்.",
      },
    },
    published: true,
    daysAgo: 18,
  },
  {
    category: "bag",
    routeNumber: "01",
    title: "Laptop bag returned within a day",
    body: "A student left a backpack with her laptop on a Colombo - Kandy bus. The conductor found it at the end of the trip and it was handed back at the depot the next morning.",
    translations: {
      si: {
        title: "ලැප්ටොප් බෑගය දිනකින් ආපසු ලැබුණා",
        body: "කොළඹ - මහනුවර බසයක ශිෂ්‍යාවක් ලැප්ටොප් සහිත බෑගයක් අමතක කළා. කොන්දොස්තර එය සොයාගෙන පසුදා උදෑසන ඩිපෝවේදී ආපසු දුන්නා.",
      },
      ta: {
        title: "மடிக்கணினி பை ஒரே நாளில் திருப்பி வழங்கப்பட்டது",
        body: "கொழும்பு - கண்டி பேருந்தில் ஒரு மாணவி மடிக்கணினியுடன் பையை விட்டுச் சென்றார். நடத்துநர் அதைக் கண்டெடுத்து மறுநாள் காலை டிப்போவில் ஒப்படைத்தார்.",
      },
    },
    published: true,
    daysAgo: 30,
  },
  {
    category: "accessibility",
    routeNumber: "138",
    title: "Priority seats now clearly marked on route 138",
    body: "Following reports from passengers with disabilities, the depot has marked priority seats on every route 138 bus and reminded crews to wait until passengers are seated.",
    translations: {
      si: {
        title: "138 මාර්ගයේ බස්වල ප්‍රමුඛතා ආසන දැන් පැහැදිලිව සලකුණු කර ඇත",
        body: "ආබාධිත මගීන්ගේ වාර්තා අනුව, ඩිපෝව සෑම 138 බසයකම ප්‍රමුඛතා ආසන සලකුණු කර, මගීන් වාඩි වන තුරු රැඳී සිටින ලෙස කාර්ය මණ්ඩලයට උපදෙස් දුන්නා.",
      },
      ta: {
        title: "வழித்தடம் 138 பேருந்துகளில் முன்னுரிமை இருக்கைகள் தெளிவாகக் குறிக்கப்பட்டுள்ளன",
        body: "மாற்றுத்திறனாளி பயணிகளின் புகார்களைத் தொடர்ந்து, டிப்போ ஒவ்வொரு 138 பேருந்திலும் முன்னுரிமை இருக்கைகளைக் குறித்து, பயணிகள் அமரும் வரை காத்திருக்குமாறு ஊழியர்களுக்கு நினைவூட்டியது.",
      },
    },
    published: true,
    daysAgo: 45,
  },
  {
    category: "road_hazard",
    routeNumber: null,
    title: "Pothole at Kadawatha junction repaired",
    body: "A deep pothole at the Kadawatha junction was reported several times by motorcyclists. The Road Development Authority filled and resurfaced it within two weeks.",
    translations: {
      si: {
        title: "කඩවත හන්දියේ වළ අලුත්වැඩියා කෙරුණා",
        body: "කඩවත හන්දියේ ගැඹුරු වළක් ගැන යතුරුපැදිකරුවන් කිහිප වරක් වාර්තා කළා. මාර්ග සංවර්ධන අධිකාරිය සති දෙකක් ඇතුළත එය අලුත්වැඩියා කළා.",
      },
      ta: {
        title: "கடவத சந்தியில் உள்ள குழி சரிசெய்யப்பட்டது",
        body: "கடவத சந்தியில் உள்ள ஆழமான குழி பற்றி மோட்டார் சைக்கிள் ஓட்டுநர்கள் பலமுறை புகார் அளித்தனர். வீதி அபிவிருத்தி அதிகாரசபை இரண்டு வாரங்களுக்குள் அதைச் சரிசெய்தது.",
      },
    },
    published: true,
    daysAgo: 60,
  },
  {
    category: "safe_driving",
    routeNumber: "87",
    title: "Night crew on route 87 thanked by passengers",
    body: "Draft: passengers on the overnight Colombo - Jaffna service have thanked the crew for careful driving and regular rest stops.",
    translations: {},
    published: false,
    daysAgo: 2,
  },
];
