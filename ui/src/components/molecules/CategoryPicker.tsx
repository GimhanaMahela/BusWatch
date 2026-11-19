"use client";

import { Box, Typography } from "@mui/material";
import { useId } from "react";

interface CategoryPickerProps<T extends string> {
  label: string;
  options: readonly { value: T; label: string }[];
  value: T | "";
  onChange: (value: T) => void;
  /** Shown under the options when set */
  error?: string;
  color?: "primary" | "success";
}

/** Large tap-friendly radio options in a grid (incident type, what was good, ...). */
function CategoryPicker<T extends string>({
  label,
  options,
  value,
  onChange,
  error,
  color = "primary",
}: CategoryPickerProps<T>) {
  const labelId = useId();
  const main = `${color}.main`;
  const channel = `var(--mui-palette-${color}-mainChannel)`;

  return (
    <Box>
      <Typography id={labelId} variant="subtitle2" sx={{ mb: 1 }}>
        {label} *
      </Typography>
      <Box
        role="radiogroup"
        aria-labelledby={labelId}
        sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 1 }}
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
              onClick={() => onChange(option.value)}
              sx={{
                all: "unset",
                boxSizing: "border-box",
                display: "flex",
                alignItems: "center",
                gap: 1.25,
                px: 1.75,
                py: 1.4,
                borderRadius: 2.5,
                cursor: "pointer",
                fontWeight: 600,
                fontSize: "0.92rem",
                border: 1.5,
                borderStyle: "solid",
                borderColor: selected ? main : "divider",
                bgcolor: selected ? `rgba(${channel} / 0.08)` : "background.paper",
                color: selected ? main : "text.primary",
                transition: "border-color 0.15s, background-color 0.15s",
                "&:hover": { borderColor: main },
                "&:focus-visible": {
                  outline: "3px solid",
                  outlineColor: `${color}.light`,
                  outlineOffset: 2,
                },
              }}
            >
              <Box
                sx={{
                  width: 18,
                  height: 18,
                  borderRadius: "50%",
                  flexShrink: 0,
                  border: 2,
                  borderStyle: "solid",
                  borderColor: selected ? main : "text.disabled",
                  display: "grid",
                  placeItems: "center",
                  "&::after": selected
                    ? { content: '""', width: 8, height: 8, borderRadius: "50%", bgcolor: main }
                    : undefined,
                }}
              />
              {option.label}
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

export default CategoryPicker;
