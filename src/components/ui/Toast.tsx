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
    border: "border-[#d9b8a8]",
    glow: "shadow-[0_22px_60px_rgba(198,154,134,0.18)]",
    iconWrap: "border-[#d9b8a8] bg-[#f8eee8] text-[#9b6f5f]",
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
    border: "border-[#d9b8a8]",
    glow: "shadow-[0_22px_60px_rgba(198,154,134,0.14)]",
    iconWrap: "border-[#d9b8a8] bg-[#f8eee8] text-[#9b6f5f]",
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
        "pointer-events-auto grid grid-cols-[2.25rem_1fr_auto] gap-3 rounded-xl border bg-white/95 p-3.5 text-[#3b302c] backdrop-blur-xl transition-all duration-200 ease-out",
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
        <p className="text-sm font-semibold leading-5 text-[#3b302c]">{toast.title}</p>
        {toast.description ? (
          <p className="mt-1 text-sm leading-5 text-[#6d554b]">
            {toast.description}
          </p>
        ) : null}
      </div>

      {dismissible ? (
        <button
          type="button"
          aria-label="Cerrar notificación"
          onClick={handleClose}
          className="flex h-7 w-7 items-center justify-center rounded-full border border-[#ead3c7] text-[#8e7a71] transition hover:border-[#d9b8a8] hover:bg-[#f8eee8] hover:text-[#3b302c]"
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
