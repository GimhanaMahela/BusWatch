import { Box } from "@mui/material";
import { SRI_LANKA_OUTLINE } from "@/constants/sriLankaOutline";
import type { HeatmapCell } from "@/types/public";

// Map frame: a little wider than the island so edge circles aren't clipped
const BOUNDS = { minLng: 79.45, maxLng: 82.05, minLat: 5.8, maxLat: 9.95 };
// Longitude degrees are shorter than latitude degrees at ~8°N; scale x so the island isn't stretched
const X_SCALE = Math.cos((8 * Math.PI) / 180);
const WIDTH = (BOUNDS.maxLng - BOUNDS.minLng) * X_SCALE * 100;
const HEIGHT = (BOUNDS.maxLat - BOUNDS.minLat) * 100;

const project = (lng: number, lat: number) => ({
  x: (lng - BOUNDS.minLng) * X_SCALE * 100,
  y: (BOUNDS.maxLat - lat) * 100,
});

const OUTLINE_PATH = SRI_LANKA_OUTLINE.map(
  (ring) =>
    ring
      .map(([lng, lat], i) => {
        const { x, y } = project(lng, lat);
        return `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join("") + "Z",
).join("");

interface IncidentHeatmapProps {
  cells: HeatmapCell[];
  /** Accessible name for the whole map */
  label: string;
  /** Text for one circle, e.g. "12 reports near 7.30, 80.65" */
  describeCell: (cell: HeatmapCell) => string;
}

/**
 * Where checked reports cluster, drawn as circles on an outline of Sri Lanka. Each circle is an
 * area (about 5 km), never a single report. Plain SVG: no map service, key or tracking.
 */
function IncidentHeatmap({ cells, label, describeCell }: IncidentHeatmapProps) {
  const max = Math.max(...cells.map((c) => c.count), 1);
  return (
    <Box
      component="svg"
      viewBox={`0 0 ${WIDTH.toFixed(0)} ${HEIGHT.toFixed(0)}`}
      role="img"
      aria-label={label}
      sx={{ width: "100%", maxHeight: 520, display: "block", mx: "auto" }}
    >
      <title>{label}</title>
      <Box
        component="path"
        d={OUTLINE_PATH}
        sx={{
          fill: "rgba(var(--mui-palette-primary-mainChannel) / 0.07)",
          stroke: "rgba(var(--mui-palette-primary-mainChannel) / 0.45)",
          strokeWidth: 1.2,
          strokeLinejoin: "round",
        }}
      />
      {/* Biggest first, so smaller circles stay visible on top */}
      {[...cells]
        .sort((a, b) => b.count - a.count)
        .map((cell) => {
          const { x, y } = project(cell.lng, cell.lat);
          const share = cell.count / max;
          return (
            <Box
              component="circle"
              key={`${cell.lat},${cell.lng}`}
              cx={x}
              cy={y}
              r={6 + Math.sqrt(share) * 16}
              sx={{
                fill: `rgba(var(--mui-palette-error-mainChannel) / ${0.25 + share * 0.45})`,
                stroke: "var(--mui-palette-error-main)",
                strokeWidth: 1,
              }}
            >
              <title>{describeCell(cell)}</title>
            </Box>
          );
        })}
    </Box>
  );
}

export default IncidentHeatmap;
