"use client";

import { Box, Typography } from "@mui/material";
import { useId, type ReactNode } from "react";

interface ChoiceCardsProps<T extends string> {
  label: string;
  options: readonly { value: T; label: string; description?: string; icon?: ReactNode }[];
  value: T | "";
  onChange: (value: T) => void;
  /** Shown under the cards when set */
  error?: string;
}

/** Big picture cards for the first, most important choice (a bus, another vehicle, the road). */
function ChoiceCards<T extends string>({
  label,
  options,
  value,
  onChange,
  error,
}: ChoiceCardsProps<T>) {
  const labelId = useId();

  return (
    <Box>
      <Typography id={labelId} variant="subtitle2" sx={{ mb: 1 }}>
        {label} *
      </Typography>
      <Box
        role="radiogroup"
        aria-labelledby={labelId}
        sx={{
          display: "grid",
          // Four cards go 2 × 2 on tablets rather than 3 + 1
          gridTemplateColumns: {
            xs: "1fr",
            sm: `repeat(${options.length === 4 ? 2 : Math.min(options.length, 3)}, 1fr)`,
            md: `repeat(${Math.min(options.length, 4)}, 1fr)`,
          },
          gap: 1.25,
        }}
      >
        {options.map((option) => {
          const selected = value === option.value;
          return (
            <Box
              key={option.value}
              component="button"
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={option.label}
              onClick={() => onChange(option.value)}
              sx={{
                all: "unset",
                boxSizing: "border-box",
                display: "flex",
                flexDirection: { xs: "row", sm: "column" },
                alignItems: { xs: "center", sm: "flex-start" },
                gap: 1.25,
                p: 2,
                borderRadius: 3,
                cursor: "pointer",
                border: 2,
                borderStyle: "solid",
                borderColor: selected ? "primary.main" : "divider",
                bgcolor: selected
                  ? "rgba(var(--mui-palette-primary-mainChannel) / 0.08)"
                  : "background.paper",
                transition: "border-color 0.15s, background-color 0.15s",
                "&:hover": { borderColor: "primary.main" },
                "&:focus-visible": {
                  outline: "3px solid",
                  outlineColor: "primary.light",
                  outlineOffset: 2,
                },
              }}
            >
              {option.icon && (
                <Box
                  aria-hidden
                  sx={{
                    width: 44,
                    height: 44,
                    flexShrink: 0,
                    borderRadius: 2.5,
                    display: "grid",
                    placeItems: "center",
                    color: selected ? "primary.contrastText" : "primary.main",
                    bgcolor: selected
                      ? "primary.main"
                      : "rgba(var(--mui-palette-primary-mainChannel) / 0.12)",
                  }}
                >
                  {option.icon}
                </Box>
              )}
              <Box>
                <Typography sx={{ fontWeight: 700, color: selected ? "primary.main" : undefined }}>
                  {option.label}
                </Typography>
                {option.description && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                    {option.description}
                  </Typography>
                )}
              </Box>
            </Box>
          );
        })}
      </Box>
      {error && (
        <Typography variant="body2" color="error" sx={{ mt: 1 }} role="alert">
          {error}
        </Typography>
      )}
    </Box>
  );
}

export default ChoiceCards;
