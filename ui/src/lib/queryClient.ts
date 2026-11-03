import { QueryClient } from "@tanstack/react-query";
import { ApiError } from "@/api/apiClient";

/** One client per browser session (created inside the Providers component). */
export const makeQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        // Don't retry client errors (401/403/404); retry network and server errors once
        retry: (failureCount, error) => {
          const status = error instanceof ApiError ? error.status : undefined;
          return failureCount < 1 && (!status || status >= 500);
        },
        refetchOnWindowFocus: false,
      },
    },
  });
