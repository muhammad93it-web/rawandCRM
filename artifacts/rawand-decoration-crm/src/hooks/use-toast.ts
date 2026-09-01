import type { ReactNode } from "react";
import type { ToastActionElement, ToastProps } from "@/components/ui/toast";

type ToasterToast = ToastProps & {
  id: string;
  title?: ReactNode;
  description?: ReactNode;
  action?: ToastActionElement;
};

let count = 0

function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER
  return count.toString()
}

// Minimal useToast implementation to satisfy imports if needed
export function useToast() {
  return {
    toast: (_props: Omit<ToasterToast, "id">) => {
       return { id: genId(), dismiss: () => {}, update: () => {} }
    },
    dismiss: (_toastId?: string) => {},
    toasts: [] as ToasterToast[],
  }
}
