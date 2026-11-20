import { describe, expect, it } from "vitest";
import { detectEmergency } from "./emergency";

describe("detectEmergency", () => {
  it.each([
    ["The bus crashed into a lorry near Kadawatha", "accident"],
    ["A man fainted and is not breathing properly", "medical"],
    ["He pulled a KNIFE on the conductor", "violence"],
    ["smoke is coming from the engine, the bus is on fire", "fire"],
    ["The conductor is following me, please help me", "danger"],
    ["බස් එක අනතුරකට ලක් වුණා", "accident"],
    ["කොන්දොස්තර පිහියෙන් තර්ජනය කළා", "violence"],
    ["ஒருவருக்கு காயம் ஏற்பட்டது", "medical"],
    ["பேருந்து விபத்து நடந்தது", "accident"],
    ["driver eka pihiya pennuwa", "violence"],
  ])("finds an emergency in %j", (text, kind) => {
    expect(detectEmergency(text)).toBe(kind);
  });

  it.each([
    "The driver was speeding and overtaking on bends",
    "Conductor charged Rs. 80 instead of 52",
    "Loud music the whole way, very fiery argument about the fare", // "fire" only as part of a word
    "புகார் தீர்வு வேண்டும்", // "தீ" inside "தீர்வு" (solution)
    "Did not stop at the gunnery junction halt",
    "",
  ])("leaves %j alone", (text) => {
    expect(detectEmergency(text)).toBeNull();
  });
});
