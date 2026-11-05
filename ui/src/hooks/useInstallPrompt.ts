"use client";

import { useSyncExternalStore } from "react";
import { canInstall, promptInstall, subscribeInstallPrompt } from "@/lib/pwa";

/** Whether the browser offered to install BusWatch, and a function that shows its dialog. */
const useInstallPrompt = () => {
  const available = useSyncExternalStore(subscribeInstallPrompt, canInstall, () => false);
  return { available, install: promptInstall };
};

export default useInstallPrompt;
