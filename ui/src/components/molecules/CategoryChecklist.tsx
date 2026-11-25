"use client";

import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import { Box, Typography } from "@mui/material";
import { useId } from "react";

interface CategoryChecklistProps<T extends string> {
  label: string;
  /** Shown under the label, e.g. "Tick all that apply" */
  hint?: string;
  options: readonly { value: T; label: string }[];
  /** Ticked options, in the order they were ticked (the first is the main one) */
  value: readonly T[];
  onChange: (value: T[]) => void;
  /** Shown under the options when set */
  error?: string;
}

/** CategoryPicker's look with tick boxes: pick one or more (what happened, what's wrong, ...). */
function CategoryChecklist<T extends string>({
  label,
  hint,
  options,
  value,
  onChange,
  error,
}: CategoryChecklistProps<T>) {
  const labelId = useId();
  const hintId = useId();

  const toggle = (option: T) =>
    onChange(value.includes(option) ? value.filter((v) => v !== option) : [...value, option]);

  return (
    <Box>
      <Typography id={labelId} variant="subtitle2">
        {label} *
      </Typography>
      {hint && (
        <Typography id={hintId} variant="body2" color="text.secondary">
          {hint}
        </Typography>
      )}
      <Box
        role="group"
        aria-labelledby={labelId}
        aria-describedby={hint ? hintId : undefined}
        sx={{
          mt: 1,
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
          gap: 1,
        }}
      >
        {options.map((option) => {
          const selected = value.includes(option.value);
          return (
            <Box
              key={option.value}
              component="button"
              type="button"
              role="checkbox"
              aria-checked={selected}
              onClick={() => toggle(option.value)}
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
                borderColor: selected ? "primary.main" : "divider",
                bgcolor: selected
                  ? "rgba(var(--mui-palette-primary-mainChannel) / 0.08)"
                  : "background.paper",
                color: selected ? "primary.main" : "text.primary",
                transition: "border-color 0.15s, background-color 0.15s",
                "&:hover": { borderColor: "primary.main" },
                "&:focus-visible": {
                  outline: "3px solid",
                  outlineColor: "primary.light",
                  outlineOffset: 2,
                },
              }}
            >
              <Box
                sx={{
                  width: 18,
                  height: 18,
                  borderRadius: "5px",
                  flexShrink: 0,
                  border: 2,
                  borderStyle: "solid",
                  borderColor: selected ? "primary.main" : "text.disabled",
                  bgcolor: selected ? "primary.main" : "transparent",
                  color: "primary.contrastText",
                  display: "grid",
                  placeItems: "center",
                }}
              >
                {selected && <CheckRoundedIcon sx={{ fontSize: 14 }} />}
              </Box>
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

export default CategoryChecklist;
