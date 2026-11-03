import { ThemeProvider } from "@mui/material/styles";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import type { ReactElement } from "react";
import theme from "@/theme/theme";

export { mockRouter } from "./mockRouter";

/** Renders `element` with the app's providers (fresh query cache, no retries). */
export function renderWithProviders(element: ReactElement) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>{element}</ThemeProvider>
    </QueryClientProvider>,
  );
}
