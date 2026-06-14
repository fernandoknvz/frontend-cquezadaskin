import { createContext } from "react";

import type { ToastType } from "@/components/ui/Toast";

export type ToastInput = {
  title: string;
  description?: string;
  duration?: number;
  dismissible?: boolean;
};

export type ToastContextValue = {
  showToast: (type: ToastType, toast: ToastInput) => string;
  success: (toast: ToastInput) => string;
  error: (toast: ToastInput) => string;
  warning: (toast: ToastInput) => string;
  info: (toast: ToastInput) => string;
  dismiss: (id: string) => void;
  clear: () => void;
};

export const ToastContext = createContext<ToastContextValue | null>(null);
