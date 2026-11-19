"use client";

import DirectionsBusRoundedIcon from "@mui/icons-material/DirectionsBusRounded";
import { Box, Button, InputAdornment, TextField } from "@mui/material";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { parseBusNumber } from "@/lib/busNumber";

interface BusLookupFormProps {
  label: string;
  button: string;
}

/** Bus number field that opens that bus's public scorecard. */
function BusLookupForm({ label, button }: BusLookupFormProps) {
  const router = useRouter();
  const [input, setInput] = useState("");
  const bus = parseBusNumber(input);

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (bus) router.push(`/bus/${encodeURIComponent(bus)}`);
  };

  return (
    <Box
      component="form"
      role="search"
      onSubmit={submit}
      sx={{ display: "flex", gap: 1, flexDirection: { xs: "column", sm: "row" } }}
    >
      <TextField
        fullWidth
        label={label}
        placeholder="NB-1234"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        slotProps={{
          htmlInput: { maxLength: 20 },
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <DirectionsBusRoundedIcon color="action" />
              </InputAdornment>
            ),
          },
        }}
      />
      <Button
        type="submit"
        variant="contained"
        size="large"
        disabled={!bus}
        sx={{ flexShrink: 0, whiteSpace: "nowrap" }}
      >
        {button}
      </Button>
    </Box>
  );
}

export default BusLookupForm;
