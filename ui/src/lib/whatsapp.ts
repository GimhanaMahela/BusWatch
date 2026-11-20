/** WhatsApp's own green, kept as is in every theme so the button is recognisable. */
export const WHATSAPP_GREEN = "#25D366";
export const WHATSAPP_GREEN_DARK = "#128C4A";

/**
 * A wa.me link that opens a chat with the TransitX bot, with a message ready to send.
 * `number` is in E.164 form (+94771234567); wa.me wants the digits only.
 */
export const whatsAppLink = (number: string, text?: string) =>
  `https://wa.me/${number.replace(/\D/g, "")}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
