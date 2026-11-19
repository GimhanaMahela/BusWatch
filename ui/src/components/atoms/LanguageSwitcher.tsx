"use client";

import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import TranslateRoundedIcon from "@mui/icons-material/TranslateRounded";
import { Button, ListItemIcon, ListItemText, Menu, MenuItem } from "@mui/material";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { LANGUAGES, type Language } from "@/constants/reportConstants";
import { writeLocaleCookie } from "@/i18n/config";

/** English / සිංහල / தமிழ் switch. The choice is stored in a cookie and the page re-renders. */
function LanguageSwitcher({ fullWidth = false }: { fullWidth?: boolean }) {
  const t = useTranslations("common");
  const locale = useLocale();
  const router = useRouter();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [pending, startTransition] = useTransition();
  const current = LANGUAGES.find((l) => l.value === locale) ?? LANGUAGES[0];

  const choose = (value: Language) => {
    setAnchor(null);
    if (value === locale) return;
    writeLocaleCookie(value);
    // The server re-renders every page (and <html lang>) in the new language
    startTransition(() => router.refresh());
  };

  return (
    <>
      <Button
        aria-label={t("changeLanguage")}
        aria-haspopup="menu"
        aria-expanded={anchor ? "true" : undefined}
        onClick={(e) => setAnchor(e.currentTarget)}
        loading={pending}
        startIcon={<TranslateRoundedIcon fontSize="small" />}
        color="inherit"
        fullWidth={fullWidth}
        sx={{
          border: 1,
          borderColor: "divider",
          borderRadius: 2.5,
          minWidth: 0,
          px: 1.25,
          color: "text.secondary",
          justifyContent: fullWidth ? "flex-start" : "center",
        }}
      >
        {fullWidth ? current.label : current.short}
      </Button>
      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={() => setAnchor(null)}
        slotProps={{ list: { "aria-label": t("language") } }}
      >
        {LANGUAGES.map((language) => (
          <MenuItem
            key={language.value}
            lang={language.value}
            selected={language.value === locale}
            onClick={() => choose(language.value)}
          >
            <ListItemIcon>
              {language.value === locale && <CheckRoundedIcon fontSize="small" />}
            </ListItemIcon>
            <ListItemText>{language.label}</ListItemText>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}

export default LanguageSwitcher;
