import { ThemeProvider } from "@mui/material/styles";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import type { ReactElement } from "react";
import type { Language } from "@/constants/reportConstants";
import theme from "@/theme/theme";
import en from "../../messages/en.json";
import si from "../../messages/si.json";
import ta from "../../messages/ta.json";

export { mockRouter, mockSearchParams } from "./mockRouter";

const MESSAGES = { en, si, ta };

/** Renders `element` with the app's providers (fresh query cache, no retries, English by default). */
export function renderWithProviders(element: ReactElement, { locale = "en" as Language } = {}) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <NextIntlClientProvider locale={locale} messages={MESSAGES[locale]} timeZone="Asia/Colombo">
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>{element}</ThemeProvider>
      </QueryClientProvider>
    </NextIntlClientProvider>,
  );
}
