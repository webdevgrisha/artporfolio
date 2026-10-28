import { toast } from "sonner";

const successDuration = 4_500;

export function showSuccessToast(message: string): void {
  toast.success(message, { duration: successDuration });
}

/** Stays until it is closed, so the message cannot be missed. */
export function showErrorToast(message: string): void {
  toast.error(message, {
    closeButton: true,
    duration: Number.POSITIVE_INFINITY,
  });
}
