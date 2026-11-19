// Emergency numbers in Sri Lanka, free from any phone. Check them again if they ever change.

export const EMERGENCY_NUMBERS = [
  { key: "police", number: "119" },
  { key: "ambulance", number: "1990" }, // Suwa Seriya, the free national ambulance service
  { key: "fire", number: "110" },
] as const;

export type EmergencyService = (typeof EMERGENCY_NUMBERS)[number]["key"];

/** The national women's helpline, shown in safety mode */
export const WOMENS_HELPLINE = "1938";
