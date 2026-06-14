import { useCallback, useMemo, useState, type ReactNode } from "react";

import { Toast, type ToastMessage, type ToastType } from "@/components/ui/Toast";
import {
  ToastContext,
  type ToastContextValue,
  type ToastInput,
} from "@/context/toast-context";

const createToastId = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const clear = useCallback(() => {
    setToasts([]);
  }, []);

  const showToast = useCallback((type: ToastType, toast: ToastInput) => {
    const id = createToastId();
    setToasts((current) => [
      ...current,
      {
        id,
        type,
        title: toast.title,
        description: toast.description,
        duration: toast.duration,
        dismissible: toast.dismissible,
      },
    ]);
    return id;
  }, []);

  const value = useMemo<ToastContextValue>(
    () => ({
      showToast,
      success: (toast) => showToast("success", toast),
      error: (toast) => showToast("error", toast),
      warning: (toast) => showToast("warning", toast),
      info: (toast) => showToast("info", toast),
      dismiss,
      clear,
    }),
    [clear, dismiss, showToast]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-[100] grid w-[calc(100%-2rem)] max-w-[23rem] gap-3 sm:right-6 sm:top-6 sm:w-[23rem]">
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} onClose={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export default ToastProvider;
