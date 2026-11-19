"use client";

import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import { Box, Chip, Typography } from "@mui/material";
import { useId } from "react";

interface ChoiceChipsProps<T extends string> {
  label: string;
  options: readonly { value: T; label: string }[];
  value: readonly T[];
  onChange: (value: T[]) => void;
  /** Shown under the chips when set */
  error?: string;
  required?: boolean;
}

/** Tick several options (accessibility issues, what happened in safety mode). */
function ChoiceChips<T extends string>({
  label,
  options,
  value,
  onChange,
  error,
  required,
}: ChoiceChipsProps<T>) {
  const labelId = useId();
  const toggle = (option: T) =>
    onChange(value.includes(option) ? value.filter((v) => v !== option) : [...value, option]);

  return (
    <Box role="group" aria-labelledby={labelId}>
      <Typography id={labelId} variant="subtitle2" sx={{ mb: 1 }}>
        {label}
        {required && " *"}
      </Typography>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
        {options.map((option) => {
          const selected = value.includes(option.value);
          return (
            <Chip
              key={option.value}
              label={option.label}
              role="checkbox"
              aria-checked={selected}
              icon={selected ? <CheckRoundedIcon /> : undefined}
              color={selected ? "primary" : "default"}
              variant={selected ? "filled" : "outlined"}
              onClick={() => toggle(option.value)}
              sx={{ height: "auto", py: 0.9, "& .MuiChip-label": { whiteSpace: "normal" } }}
            />
          );
        })}
      </Box>
      {error && (
        <Typography variant="caption" color="error" sx={{ display: "block", mt: 0.75 }}>
          {error}
        </Typography>
      )}
    </Box>
  );
}

export default ChoiceChips;
