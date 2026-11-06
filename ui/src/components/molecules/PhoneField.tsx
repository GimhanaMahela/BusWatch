"use client";

import PhoneIphoneRoundedIcon from "@mui/icons-material/PhoneIphoneRounded";
import { InputAdornment, TextField } from "@mui/material";
import { useState, type ChangeEvent } from "react";
import { normalisePhone } from "@/lib/phone";

interface PhoneFieldProps {
  name: string;
  label: string;
  helperText: string;
  invalidText: string;
  value: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
}

/**
 * Optional mobile number. An unusable number blocks the surrounding form through the browser's
 * own validation (setCustomValidity), so it is caught before the report is sent.
 */
function PhoneField({ name, label, helperText, invalidText, value, onChange }: PhoneFieldProps) {
  const [touched, setTouched] = useState(false);
  const invalid = value.trim() !== "" && normalisePhone(value) === null;

  return (
    <TextField
      fullWidth
      type="tel"
      name={name}
      label={label}
      value={value}
      autoComplete="tel"
      onChange={onChange}
      onBlur={() => setTouched(true)}
      error={touched && invalid}
      helperText={touched && invalid ? invalidText : helperText}
      inputRef={(input: HTMLInputElement | null) =>
        input?.setCustomValidity(invalid ? invalidText : "")
      }
      slotProps={{
        input: {
          startAdornment: (
            <InputAdornment position="start">
              <PhoneIphoneRoundedIcon color="action" />
            </InputAdornment>
          ),
        },
        htmlInput: { maxLength: 30, inputMode: "tel" },
      }}
    />
  );
}

export default PhoneField;
