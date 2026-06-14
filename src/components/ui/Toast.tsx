import { useEffect, useState, type ReactNode } from "react";
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from "lucide-react";

import { cn } from "@/lib/utils";

export type ToastType = "success" | "error" | "warning" | "info";

export type ToastMessage = {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
  dismissible?: boolean;
};

type ToastProps = {
  toast: ToastMessage;
  onClose: (id: string) => void;
};

const styles: Record<
  ToastType,
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

export function Toast({ toast, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const style = styles[toast.type];
  const duration = toast.duration ?? 3000;
  const dismissible = toast.dismissible ?? true;

  useEffect(() => {
    const enterTimer = window.setTimeout(() => setIsVisible(true), 20);
    const exitTimer = window.setTimeout(() => setIsVisible(false), duration);
    const closeTimer = window.setTimeout(() => onClose(toast.id), duration + 220);

    return () => {
      window.clearTimeout(enterTimer);
      window.clearTimeout(exitTimer);
      window.clearTimeout(closeTimer);
    };
  }, [duration, onClose, toast.id]);

  const handleClose = () => {
    setIsVisible(false);
    window.setTimeout(() => onClose(toast.id), 180);
  };

  return (
    <div
      role={toast.type === "error" ? "alert" : "status"}
      aria-live={toast.type === "error" ? "assertive" : "polite"}
      aria-atomic="true"
      className={cn(
        "pointer-events-auto grid grid-cols-[2.25rem_1fr_auto] gap-3 rounded-xl border bg-[#0A0F10]/90 p-3.5 text-white backdrop-blur-xl transition-all duration-200 ease-out",
        style.border,
        style.glow,
        isVisible
          ? "translate-y-0 opacity-100"
          : "-translate-y-3 opacity-0 sm:translate-x-3 sm:translate-y-0"
      )}
    >
      <div
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-full border",
          style.iconWrap
        )}
      >
        {style.icon}
      </div>

      <div className="min-w-0 pt-0.5">
        <p className="text-sm font-semibold leading-5 text-white">{toast.title}</p>
        {toast.description ? (
          <p className="mt-1 text-sm leading-5 text-[#D6D6D6]">
            {toast.description}
          </p>
        ) : null}
      </div>

      {dismissible ? (
        <button
          type="button"
          aria-label="Cerrar notificacion"
          onClick={handleClose}
          className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 text-[#B8B8B8] transition hover:border-white/20 hover:bg-white/10 hover:text-white"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      ) : (
        <span aria-hidden="true" />
      )}
    </div>
  );
}

export default Toast;
