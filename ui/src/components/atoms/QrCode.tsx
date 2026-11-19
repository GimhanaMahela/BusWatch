import QRCode from "qrcode";
import { useMemo } from "react";

interface QrCodeProps {
  value: string;
  /** Rendered width and height (any CSS length) */
  size?: number | string;
  /** Accessible name, e.g. "QR code for bus NB-1234" */
  title: string;
}

const QUIET_ZONE = 2; // modules of white border scanners need around the code

/** Crisp, scalable QR code drawn as one SVG path (prints sharply at any size). */
function QrCode({ value, size = 160, title }: QrCodeProps) {
  const { path, dimension } = useMemo(() => {
    // "M" error correction survives a scuffed or partly covered sticker
    const { modules } = QRCode.create(value, { errorCorrectionLevel: "M" });
    let d = "";
    for (let row = 0; row < modules.size; row++) {
      for (let col = 0; col < modules.size; col++) {
        if (modules.get(row, col)) d += `M${col + QUIET_ZONE} ${row + QUIET_ZONE}h1v1h-1z`;
      }
    }
    return { path: d, dimension: modules.size + QUIET_ZONE * 2 };
  }, [value]);

  return (
    <svg
      role="img"
      aria-label={title}
      viewBox={`0 0 ${dimension} ${dimension}`}
      width={size}
      height={size}
      shapeRendering="crispEdges"
      style={{ display: "block", background: "#fff" }}
    >
      <title>{title}</title>
      <path d={path} fill="#000" />
    </svg>
  );
}

export default QrCode;
