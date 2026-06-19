import { CheckCircle2, Info, XCircle } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type InlineFeedbackTone = "success" | "error" | "info";

type InlineFeedbackProps = {
  tone: InlineFeedbackTone;
  message: string;
  className?: string;
};

const toneStyles: Record<
  InlineFeedbackTone,
  { className: string; icon: ReactNode }
> = {
  success: {
    className: "border-[#d9b8a8] bg-[#f8eee8] text-[#4b3932]",
    icon: <CheckCircle2 className="h-4 w-4 text-[#9b6f5f]" />,
  },
  error: {
    className: "border-red-400/30 bg-red-500/10 text-red-200",
    icon: <XCircle className="h-4 w-4 text-red-300" />,
  },
  info: {
    className: "border-sky-300/30 bg-sky-400/10 text-sky-100",
    icon: <Info className="h-4 w-4 text-sky-200" />,
  },
};

export function InlineFeedback({ tone, message, className }: InlineFeedbackProps) {
  const styles = toneStyles[tone];

  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "flex items-start gap-2 rounded-2xl border p-3 text-sm leading-6",
        styles.className,
        className
      )}
    >
      <span className="mt-0.5 shrink-0">{styles.icon}</span>
      <span>{message}</span>
    </div>
  );
}

export default InlineFeedback;
