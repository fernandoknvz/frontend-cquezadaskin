import { useEffect, useState, type ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from "lucide-react";

import { cn } from "@/lib/utils";

type NotificationToastVariant = "success" | "error" | "warning" | "info";

type NotificationToastProps = {
  variant: NotificationToastVariant;
  title: string;
  description: string;
  duration?: number;
  onClose: () => void;
};

const variantStyles: Record<
  NotificationToastVariant,
  {
    border: string;
    glow: string;
    iconWrap: string;
    icon: ReactNode;
  }
> = {
  success: {
    border: "border-[#00D1C1]/60",
    glow: "shadow-[0_22px_60px_rgba(0,209,193,0.18)]",
    iconWrap: "border-[#00D1C1]/35 bg-[#00D1C1]/12 text-[#20E0D0]",
    icon: <CheckCircle2 className="h-4 w-4" />,
  },
  error: {
    border: "border-red-300/45",
    glow: "shadow-[0_22px_60px_rgba(248,113,113,0.16)]",
    iconWrap: "border-red-300/30 bg-red-500/12 text-red-200",
    icon: <XCircle className="h-4 w-4" />,
  },
  warning: {
    border: "border-amber-300/45",
    glow: "shadow-[0_22px_60px_rgba(251,191,36,0.14)]",
    iconWrap: "border-amber-300/30 bg-amber-400/12 text-amber-200",
    icon: <AlertTriangle className="h-4 w-4" />,
  },
  info: {
    border: "border-sky-300/45",
    glow: "shadow-[0_22px_60px_rgba(56,189,248,0.14)]",
    iconWrap: "border-sky-300/30 bg-sky-400/12 text-sky-200",
    icon: <Info className="h-4 w-4" />,
  },
};

export function NotificationToast({
  variant,
  title,
  description,
  duration = 4000,
  onClose,
}: NotificationToastProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const enterTimer = window.setTimeout(() => setIsVisible(true), 20);
    const exitTimer = window.setTimeout(() => setIsVisible(false), duration);
    const closeTimer = window.setTimeout(() => onClose(), duration + 220);

    return () => {
      window.clearTimeout(enterTimer);
      window.clearTimeout(exitTimer);
      window.clearTimeout(closeTimer);
    };
  }, [description, duration, onClose, title, variant]);

  const handleClose = () => {
    setIsVisible(false);
    window.setTimeout(onClose, 180);
  };

  const styles = variantStyles[variant];

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="pointer-events-none fixed left-1/2 top-4 z-50 w-[calc(100%-2rem)] max-w-[22rem] -translate-x-1/2 sm:left-auto sm:right-6 sm:top-6 sm:w-[22rem] sm:translate-x-0"
    >
      <div
        role="status"
        className={cn(
          "pointer-events-auto grid grid-cols-[2.25rem_1fr_auto] gap-3 rounded-xl border bg-[#0A0F10]/88 p-3.5 text-white backdrop-blur-xl transition-all duration-200 ease-out",
          styles.border,
          styles.glow,
          isVisible
            ? "translate-y-0 opacity-100"
            : "-translate-y-3 opacity-0 sm:translate-x-3 sm:translate-y-0"
        )}
      >
        <div
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-full border",
            styles.iconWrap
          )}
        >
          {styles.icon}
        </div>

        <div className="min-w-0 pt-0.5">
          <p className="text-sm font-semibold leading-5 text-white">{title}</p>
          <p className="mt-1 text-sm leading-5 text-[#D6D6D6]">
            {description}
          </p>
        </div>

        <button
          type="button"
          aria-label="Cerrar notificacion"
          onClick={handleClose}
          className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 text-[#B8B8B8] transition hover:border-white/20 hover:bg-white/10 hover:text-white"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
