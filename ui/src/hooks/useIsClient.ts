import { useSyncExternalStore } from "react";

const noopSubscribe = () => () => {};

/** False while rendering on the server and hydrating, true afterwards. */
export default function useIsClient(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}
