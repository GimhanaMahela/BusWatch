"use client";

import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import { Button, type ButtonProps } from "@mui/material";
import useContactChannels from "@/hooks/useContactChannels";
import { WHATSAPP_GREEN, WHATSAPP_GREEN_DARK, whatsAppLink } from "@/lib/whatsapp";

interface WhatsAppButtonProps extends Omit<ButtonProps<"a">, "href" | "children"> {
  label: string;
  /** Message ready to send when WhatsApp opens */
  message?: string;
}

/**
 * Opens a chat with the TransitX WhatsApp bot. Renders nothing when the bot isn't set up.
 * "contained" uses WhatsApp green; "outlined" suits light panels.
 */
function WhatsAppButton({
  label,
  message,
  variant = "contained",
  sx,
  ...props
}: WhatsAppButtonProps) {
  const number = useContactChannels()?.whatsapp;
  if (!number) return null;
  return (
    <Button
      {...props}
      variant={variant}
      href={whatsAppLink(number, message)}
      target="_blank"
      rel="noopener noreferrer"
      startIcon={<WhatsAppIcon />}
      sx={[
        variant === "contained"
          ? {
              bgcolor: WHATSAPP_GREEN,
              color: "#062E16",
              "&:hover": { bgcolor: WHATSAPP_GREEN_DARK, color: "common.white" },
            }
          : { borderColor: WHATSAPP_GREEN, color: "text.primary" },
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
    >
      {label}
    </Button>
  );
}

export default WhatsAppButton;
