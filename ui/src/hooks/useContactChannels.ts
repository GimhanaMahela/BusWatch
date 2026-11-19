"use client";

import { useQuery } from "@tanstack/react-query";
import { getContactChannels } from "@/api/passengerApi";

/**
 * Which ways of reaching passengers are switched on (SMS, Telegram...), so forms only offer
 * those. Fetched once per visit.
 */
const useContactChannels = () =>
  useQuery({
    queryKey: ["contactChannels"],
    queryFn: getContactChannels,
    staleTime: Infinity,
    retry: false,
  }).data;

/**
 * Whether to offer the phone number field. Shown until the server says SMS is off, so it still
 * appears while offline (reports written offline are sent later).
 */
export const useSmsAvailable = () => useContactChannels()?.sms !== false;

export default useContactChannels;
