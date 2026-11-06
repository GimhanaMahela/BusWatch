import InitColorSchemeScript from "@mui/material/InitColorSchemeScript";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v16-appRouter";
import type { Metadata, Viewport } from "next";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import { Noto_Sans_Sinhala, Noto_Sans_Tamil, Plus_Jakarta_Sans } from "next/font/google";
import type { ReactNode } from "react";
import Providers from "./providers";

const sans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

// Plus Jakarta Sans has no Sinhala or Tamil glyphs; the browser falls back to these per character
const sinhala = Noto_Sans_Sinhala({
  subsets: ["sinhala"],
  display: "swap",
  variable: "--font-sinhala",
  preload: false,
});
const tamil = Noto_Sans_Tamil({
  subsets: ["tamil"],
  display: "swap",
  variable: "--font-tamil",
  preload: false,
});

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta");
  const siteUrl = process.env.FRONTEND_URL;
  return {
    // Absolute URLs for share previews; Next falls back to the deployment URL when unset
    metadataBase: siteUrl ? new URL(siteUrl) : undefined,
    title: { default: t("title"), template: "%s · BusWatch" },
    description: t("description"),
    applicationName: "BusWatch",
    manifest: "/manifest.json",
    icons: { icon: "/favicon.ico", apple: "/logo192.png" },
    appleWebApp: { capable: true, title: "BusWatch", statusBarStyle: "default" },
    openGraph: {
      siteName: "BusWatch",
      type: "website",
      title: t("title"),
      description: t("description"),
    },
    twitter: { card: "summary_large_image" },
  };
}

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F5F7FB" },
    { media: "(prefers-color-scheme: dark)", color: "#090D18" },
  ],
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const locale = await getLocale();
  return (
    <html
      lang={locale}
      className={`${sans.variable} ${sinhala.variable} ${tamil.variable}`}
      suppressHydrationWarning
    >
      {/* Browser extensions (e.g. ColorZilla's cz-shortcut-listen) add attributes to <body> before
          React loads; ignore those. Only this element's own attributes are exempt. */}
      <body suppressHydrationWarning>
        {/* Applies the saved light/dark choice before first paint (no flash) */}
        <InitColorSchemeScript attribute="class" />
        <AppRouterCacheProvider options={{ enableCssLayer: true }}>
          <NextIntlClientProvider>
            <Providers>{children}</Providers>
          </NextIntlClientProvider>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
