"use client";

import ReceiptLongRoundedIcon from "@mui/icons-material/ReceiptLongRounded";
import { Box, Button, InputAdornment, TextField } from "@mui/material";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, type FormEvent } from "react";

interface ReceiptSearchFormProps {
  /** Text shown in the field; the form resets to it when it changes (e.g. browser back) */
  defaultValue?: string;
  loading?: boolean;
  /** Defaults to opening /track/<id> */
  onSearch?: (receiptId: string) => void;
  size?: "medium" | "large";
}

/** Receipt ID field with a Track button. */
function ReceiptSearchForm({
  defaultValue = "",
  loading = false,
  onSearch,
  size = "medium",
}: ReceiptSearchFormProps) {
  const t = useTranslations("receiptSearch");
  const router = useRouter();
  const [input, setInput] = useState(defaultValue);

  const [shownDefault, setShownDefault] = useState(defaultValue);
  if (defaultValue !== shownDefault) {
    setShownDefault(defaultValue);
    setInput(defaultValue);
  }

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const id = input.trim();
    if (!id) return;
    if (onSearch) onSearch(id);
    else router.push(`/track/${encodeURIComponent(id)}`);
  };

  const large = size === "large";
  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      role="search"
      sx={{ display: "flex", gap: 1, flexDirection: { xs: "column", sm: "row" } }}
    >
      <TextField
        fullWidth
        label={t("label")}
        placeholder="BW-2026-XXXXXX"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <ReceiptLongRoundedIcon color="action" />
              </InputAdornment>
            ),
            sx: {
              fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
              fontWeight: 600,
              ...(large && { height: 56 }),
            },
          },
        }}
      />
      <Button
        type="submit"
        variant="contained"
        size="large"
        loading={loading}
        disabled={!input.trim()}
        sx={{ flexShrink: 0, minWidth: 120, ...(large && { height: 56 }) }}
      >
        {t("button")}
      </Button>
    </Box>
  );
}

export default ReceiptSearchForm;
