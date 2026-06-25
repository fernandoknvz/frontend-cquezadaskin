import { siteConfig } from "@/config/site";

export const DEFAULT_WHATSAPP_MESSAGE =
  "¡Hola! Me gustaría agendar una hora con CQUEZADASKIN.";

export const getWhatsAppUrl = (
  message = DEFAULT_WHATSAPP_MESSAGE,
  phoneNumber = siteConfig.whatsapp
) => {
  const text = encodeURIComponent(message.trim() || DEFAULT_WHATSAPP_MESSAGE);
  return `https://wa.me/${phoneNumber}?text=${text}`;
};
