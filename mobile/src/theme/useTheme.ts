import { useColorScheme } from "react-native";

import { palettes, type Palette } from "./colors";

/** The palette for the phone's light or dark setting. */
export const useTheme = (): Palette => palettes[useColorScheme() === "dark" ? "dark" : "light"];
