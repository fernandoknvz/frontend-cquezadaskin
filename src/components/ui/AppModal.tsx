import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AppModalProps = {
  open: boolean;
  title: string;
  description?: string;
  children: ReactNode;
  onOpenChange: (open: boolean) => void;
  className?: string;
};

export function AppModal({
  open,
  title,
  description,
  children,
  onOpenChange,
  className,
}: AppModalProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          className={cn(
            "fixed left-1/2 top-1/2 z-50 grid max-h-[90dvh] w-[min(94vw,760px)] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border border-white/10 bg-[#121212] text-white shadow-2xl outline-none data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 sm:rounded-3xl",
            className
          )}
        >
          <div className="flex items-start justify-between gap-3 border-b border-white/10 px-4 py-4 sm:gap-4 sm:px-5">
            <div>
              <DialogPrimitive.Title className="text-xl font-semibold text-white">
                {title}
              </DialogPrimitive.Title>
              {description ? (
                <DialogPrimitive.Description className="mt-1 text-sm text-[#A8A8A8]">
                  {description}
                </DialogPrimitive.Description>
              ) : null}
            </div>
            <DialogPrimitive.Close asChild>
              <Button type="button" variant="outline" size="icon-sm">
                <X className="h-4 w-4" />
                <span className="sr-only">Cerrar</span>
              </Button>
            </DialogPrimitive.Close>
          </div>
          <div className="max-h-[calc(90dvh-82px)] overflow-y-auto px-4 py-4 sm:px-5 sm:py-5">
            {children}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

export default AppModal;
