import { AnimatePresence, motion } from "framer-motion";
import { CalendarCheck2, Send, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { FaWhatsapp } from "react-icons/fa";

import { siteConfig } from "@/config/site";

type Props = {
  phoneNumber?: string;
  defaultMessage?: string;
  position?: "bottom-right" | "bottom-left";
  maxLift?: number;
  liftDistanceFromBottom?: number;
};

export default function WhatsAppWidget({
  phoneNumber = siteConfig.whatsapp,
  defaultMessage = "¡Hola! Me gustaría agendar una hora con CQUEZADASKIN.",
  position = "bottom-right",
  maxLift = 280,
  liftDistanceFromBottom = 800,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState(defaultMessage);
  const [liftAmount, setLiftAmount] = useState(0);

  const containerRef = useRef<HTMLDivElement | null>(null);

  const posClasses =
    position === "bottom-left"
      ? "left-4 bottom-4 items-start sm:left-6 sm:bottom-6"
      : "right-4 bottom-4 items-end sm:right-6 sm:bottom-6";

  const waUrl = useMemo(() => {
    const text = encodeURIComponent(message.trim() || defaultMessage);
    return `https://wa.me/${phoneNumber}?text=${text}`;
  }, [phoneNumber, message, defaultMessage]);

  const handleSendMessage = () => {
    if (!message.trim()) return;
    window.open(waUrl, "_blank", "noopener,noreferrer");
    setMessage(defaultMessage);
    setIsOpen(false);
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };

    const onPointerDown = (e: PointerEvent) => {
      if (!isOpen) return;
      const el = containerRef.current;
      if (el && !el.contains(e.target as Node)) setIsOpen(false);
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("pointerdown", onPointerDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("pointerdown", onPointerDown);
    };
  }, [isOpen]);

  useEffect(() => {
    let raf = 0;

    const compute = () => {
      const scrollTop = window.scrollY;
      const viewportH = window.innerHeight;
      const docH = document.documentElement.scrollHeight;
      const remaining = docH - (scrollTop + viewportH);
      const progress = Math.min(
        1,
        Math.max(0, (liftDistanceFromBottom - remaining) / liftDistanceFromBottom)
      );
      const nextLift = progress * maxLift;

      setLiftAmount((prev) => (Math.abs(prev - nextLift) < 0.5 ? prev : nextLift));
    };

    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(compute);
    };

    compute();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [maxLift, liftDistanceFromBottom]);

  return (
    <motion.div
      ref={containerRef}
      animate={{ y: -liftAmount }}
      transition={{ type: "tween", duration: 0.35, ease: "easeOut" }}
      className={`fixed ${posClasses} z-50 flex flex-col gap-3 sm:gap-4`}
    >
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="panel"
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="
              w-72 max-w-[calc(100vw-2rem)]
              rounded-2xl border border-[#d9b8a8]
              bg-white shadow-lg
              p-4
            "
            role="dialog"
            aria-label="Chat de WhatsApp"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-[#3b302c]">
                  ¿En qué podemos ayudarte?
                </div>
                <div className="mt-0.5 text-xs text-[#7d6a61]">
                  Escribe y te respondemos rápido.
                </div>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="
                  rounded-full p-2
                  text-[#8e7a71] hover:text-red-500
                  hover:bg-[#f8eee8]
                  transition
                  focus:outline-none focus:ring-2 focus:ring-[#c69a86]
                "
                aria-label="Cerrar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Escribe tu mensaje..."
              rows={3}
              className="
                mt-3 w-full resize-none
                rounded-xl border border-[#ead3c7]
                bg-[#fffaf7] px-3 py-2
                text-sm text-[#3b302c]
                placeholder:text-[#a8968d]
                focus:outline-none focus:ring-2 focus:ring-[#c69a86]
              "
            />

            <button
              onClick={handleSendMessage}
              className="
                mt-3 w-full inline-flex items-center justify-center gap-2
                rounded-xl bg-[#f1d5cc] py-2
                text-sm font-semibold text-[#4b3932]
                shadow-sm
                hover:bg-[#e8c2b5] transition
                focus:outline-none focus:ring-4 focus:ring-[#c69a86]/25
              "
            >
              <Send className="h-4 w-4" />
              Enviar mensaje
            </button>

            <div className="mt-2 text-[11px] text-[#7d6a61]">
              * Se abrirá WhatsApp en una pestaña nueva.
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.a
        href="/agendar"
        className="
          group relative h-12 w-12 rounded-full sm:h-16 sm:w-16
          border border-white/10
          bg-[#f1d5cc] text-[#4b3932]
          shadow-[0_14px_34px_rgba(80,55,45,0.22),0_0_18px_rgba(198,154,134,0.22)]
          flex items-center justify-center
          transition-[background-color,box-shadow,border-color]
          hover:bg-[#e8c2b5] hover:border-[#c69a86]/80 hover:shadow-[0_16px_40px_rgba(80,55,45,0.24),0_0_20px_rgba(198,154,134,0.34)]
          focus:outline-none focus:ring-4 focus:ring-[#c69a86]/30
        "
        aria-label="Agendar cita"
        initial={{ opacity: 0, scale: 0.86, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ delay: 0.08, duration: 0.28, ease: "easeOut" }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.96 }}
      >
        <span className="pointer-events-none absolute right-[4.75rem] hidden whitespace-nowrap rounded-full border border-[#d9b8a8] bg-white/95 px-3 py-1.5 text-xs font-semibold text-[#4b3932] shadow-[0_10px_30px_rgba(80,55,45,0.18)] backdrop-blur group-hover:block">
          Agendar cita
        </span>
        <CalendarCheck2 className="h-6 w-6 sm:h-8 sm:w-8" strokeWidth={2.1} />
      </motion.a>

      <motion.button
        onClick={() => setIsOpen((v) => !v)}
        className="
          group relative h-12 w-12 rounded-full sm:h-16 sm:w-16
          border border-white/10
          bg-[#25D366] text-white
          shadow-[0_14px_34px_rgba(0,0,0,0.38),0_0_18px_rgba(37,211,102,0.22)]
          flex items-center justify-center
          transition-[background-color,box-shadow,border-color]
          hover:bg-[#2DE978] hover:border-[#2DE978]/80 hover:shadow-[0_16px_40px_rgba(0,0,0,0.42),0_0_20px_rgba(37,211,102,0.4)]
          focus:outline-none focus:ring-4 focus:ring-[#25D366]/30
        "
        aria-label={isOpen ? "Cerrar chat de WhatsApp" : "Abrir chat de WhatsApp"}
        initial={{ opacity: 0, scale: 0.86, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ delay: 0.16, duration: 0.28, ease: "easeOut" }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.96 }}
      >
        <span className="pointer-events-none absolute right-[4.75rem] hidden whitespace-nowrap rounded-full border border-[#25D366]/25 bg-[#fffaf7]/95 px-3 py-1.5 text-xs font-semibold text-white shadow-[0_10px_30px_rgba(0,0,0,0.32)] backdrop-blur group-hover:block">
          Escribir por WhatsApp
        </span>
        <FaWhatsapp className="h-7 w-7 sm:h-9 sm:w-9" aria-hidden="true" />
      </motion.button>
    </motion.div>
  );
}
