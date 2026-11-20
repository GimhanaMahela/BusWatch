import { ImageResponse } from "next/og";
import { activeTheme } from "@/theme/themes";

// Social preview images (WhatsApp, Facebook, X) for shared links. Satori's default font covers
// Latin only, so previews are in English whatever the site language.

export const OG_SIZE = { width: 1200, height: 630 };

interface OgCardProps {
  eyebrow: string;
  title: string;
  subtitle?: string;
  /** Coloured pill, e.g. the report status */
  badge?: { text: string; color: string };
}

export const renderOgCard = ({ eyebrow, title, subtitle, badge }: OgCardProps) =>
  new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 72,
        color: "white",
        background: activeTheme.deepGradient,
        fontFamily: "sans-serif",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 18,
            background: "#FE6E01",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 38,
            fontWeight: 800,
          }}
        >
          X
        </div>
        <div style={{ fontSize: 40, fontWeight: 800 }}>TransitX</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <div style={{ fontSize: 30, opacity: 0.8, textTransform: "uppercase", letterSpacing: 4 }}>
          {eyebrow}
        </div>
        <div style={{ fontSize: 72, fontWeight: 800, lineHeight: 1.05 }}>{title}</div>
        {subtitle && <div style={{ fontSize: 34, opacity: 0.9 }}>{subtitle}</div>}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        {badge ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              padding: "14px 28px",
              borderRadius: 999,
              background: "white",
              color: badge.color,
              fontSize: 34,
              fontWeight: 800,
            }}
          >
            <div style={{ width: 18, height: 18, borderRadius: 9, background: badge.color }} />
            {badge.text}
          </div>
        ) : (
          <div />
        )}
        <div style={{ fontSize: 28, opacity: 0.8 }}>Report · Resolve · Improve</div>
      </div>
    </div>,
    OG_SIZE,
  );
