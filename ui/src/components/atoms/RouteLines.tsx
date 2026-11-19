import { Box, type SxProps, type Theme } from "@mui/material";

/**
 * Decorative bus-route map: curved lines with stops, in the theme's colours. Purely visual
 * (hidden from screen readers); place it absolutely inside a positioned, overflow-hidden parent.
 */
function RouteLines({ sx }: { sx?: SxProps<Theme> }) {
  return (
    <Box
      component="svg"
      aria-hidden
      viewBox="0 0 600 420"
      fill="none"
      sx={[{ pointerEvents: "none", display: "block" }, ...(Array.isArray(sx) ? sx : [sx])]}
    >
      <defs>
        <linearGradient id="bw-route-a" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="var(--mui-palette-primary-main)" stopOpacity="0" />
          <stop offset="0.35" stopColor="var(--mui-palette-primary-main)" stopOpacity="0.55" />
          <stop offset="1" stopColor="var(--mui-palette-secondary-main)" stopOpacity="0.5" />
        </linearGradient>
        <linearGradient id="bw-route-b" x1="1" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--bw-accent)" stopOpacity="0" />
          <stop offset="0.5" stopColor="var(--bw-accent)" stopOpacity="0.45" />
          <stop offset="1" stopColor="var(--bw-accent)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        d="M10 360 C 140 340, 170 220, 290 210 S 470 120, 590 40"
        stroke="url(#bw-route-a)"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <path
        d="M40 60 C 160 110, 220 260, 360 290 S 520 330, 590 400"
        stroke="url(#bw-route-b)"
        strokeWidth="3"
        strokeDasharray="2 10"
        strokeLinecap="round"
      />
      <path
        d="M120 410 C 200 300, 330 330, 420 220 S 520 90, 600 120"
        stroke="url(#bw-route-a)"
        strokeOpacity="0.5"
        strokeWidth="2"
        strokeLinecap="round"
      />
      {[
        [290, 210],
        [470, 112],
        [360, 290],
        [420, 220],
      ].map(([cx, cy]) => (
        <g key={`${cx}-${cy}`}>
          <circle cx={cx} cy={cy} r="9" fill="var(--mui-palette-background-paper)" />
          <circle
            cx={cx}
            cy={cy}
            r="9"
            stroke="var(--mui-palette-primary-main)"
            strokeOpacity="0.6"
            strokeWidth="3"
          />
        </g>
      ))}
    </Box>
  );
}

export default RouteLines;
