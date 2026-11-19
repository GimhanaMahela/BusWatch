import type { EmergencyService } from "@/constants/emergency";

// Emergency shortcut: an instant, offline check of what the passenger is typing. It runs on every
// keystroke and needs no network, so call buttons can appear before the report is finished. The
// AI check (api/src/services/emergency.service.ts) catches what these words miss.

export type EmergencyKind = "violence" | "medical" | "fire" | "accident" | "danger";

// Lower-case English and transliterated Sinhala/Tamil ("Singlish") are matched as whole words;
// Sinhala and Tamil script as parts of words (they join suffixes on). Very short script words
// are left out because they turn up inside ordinary words (Tamil "தீ" is in "தீர்வு", solution).
const WORDS: Record<EmergencyKind, { latin: string[]; script: string[] }> = {
  accident: {
    latin: [
      "accident",
      "crash",
      "crashed",
      "collided",
      "collision",
      "overturned",
      "toppled",
      "ran over",
      "run over",
      "knocked down",
      "anathuru",
      "anathuruva",
      "hapuna",
      "happuna",
    ],
    script: ["අනතුර", "හැප්පුණ", "හැප්පුන", "පෙරළුණ", "விபத்து", "மோதிய", "மோதியது", "கவிழ்ந்த"],
  },
  medical: {
    latin: [
      "injured",
      "injuries",
      "bleeding",
      "unconscious",
      "fainted",
      "collapsed",
      "not breathing",
      "heart attack",
      "seizure",
      "broken leg",
      "broken arm",
      "thuwala",
      "thuwaala",
      "sihiya naha",
    ],
    script: [
      "තුවාල",
      "ලේ ගල",
      "සිහිය නැති",
      "ක්ලාන්ත",
      "හුස්ම ගන්න බැරි",
      "காயம்",
      "காயமடை",
      "இரத்தம்",
      "ரத்தம்",
      "மயக்க",
      "மூச்சு விட",
    ],
  },
  violence: {
    latin: [
      "stabbed",
      "knife",
      "gun",
      "weapon",
      "assaulted",
      "attacked",
      "beaten",
      "beating me",
      "hit me",
      "raped",
      "rape",
      "sexual assault",
      "kidnap",
      "kidnapped",
      "pihiya",
      "pihiyen",
      "gahuwa",
      "gahanawa",
    ],
    script: [
      "පිහිය",
      "පිහියෙන්",
      "තුවක්කු",
      "පහර දුන්",
      "පහරදුන්",
      "ගහනවා",
      "ගැහුවා",
      "ස්ත්‍රී දූෂණ",
      "පැහැරගත්",
      "கத்தியால்",
      "கத்தி காட்டி",
      "துப்பாக்கி",
      "தாக்கின",
      "தாக்குதல்",
      "அடித்தார்",
      "அடிக்கிறார்",
      "கற்பழி",
      "கடத்த",
    ],
  },
  fire: {
    latin: ["fire", "on fire", "burning", "smoke", "flames", "ginna", "gini"],
    script: ["ගින්න", "ගිනි ගත්", "ගිනිගත්", "දුම් දමන", "தீப்பிடி", "தீ விபத்து", "புகை வருகிறது"],
  },
  danger: {
    latin: [
      "following me",
      "followed me home",
      "won't let me off",
      "wont let me off",
      "locked in",
      "help me",
      "save me",
      "in danger",
      "threatening to kill",
      "beraganna",
    ],
    script: [
      "මාව පන්නගෙන",
      "බේරගන්න",
      "මරනවා කිව්ව",
      "என்னைப் பின்தொடர்",
      "காப்பாற்றுங்கள்",
      "கொல்லுவேன்",
    ],
  },
};

const ORDER: EmergencyKind[] = ["violence", "medical", "fire", "accident", "danger"];

const escape = (word: string) => word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const PATTERNS = ORDER.map((kind) => {
  const { latin, script } = WORDS[kind];
  return {
    kind,
    latin: new RegExp(`(^|[^a-z])(${latin.map(escape).join("|")})(?![a-z])`, "i"),
    script,
  };
});

/** The first kind of emergency the text mentions, or null. */
export const detectEmergency = (text: string): EmergencyKind | null => {
  if (!text.trim()) return null;
  const lower = text.toLowerCase();
  for (const { kind, latin, script } of PATTERNS) {
    if (latin.test(lower) || script.some((word) => text.includes(word))) return kind;
  }
  return null;
};

/** Which number to show first for each kind of emergency */
export const FIRST_SERVICE: Record<EmergencyKind, EmergencyService> = {
  violence: "police",
  danger: "police",
  medical: "ambulance",
  accident: "ambulance",
  fire: "fire",
};
