import { toast } from "sonner";

const successDuration = 4_500;

interface ToastOptions {
  /**
   * Toasts with the same id replace each other instead of piling up. Give the results of one
   * action a common id, so a repeated error or a later success replaces the previous toast.
   */
  id?: string;
}

export function showSuccessToast(message: string, { id }: ToastOptions = {}): void {
  toast.success(message, { duration: successDuration, id });
}

/** Stays until it is closed, so the message cannot be missed. */
export function showErrorToast(message: string, { id }: ToastOptions = {}): void {
  toast.error(message, { duration: Number.POSITIVE_INFINITY, id });
}

/** The result of saving a form: why something was not saved, or that everything was. */
export function showSaveResultToast(error: string | undefined, options: ToastOptions = {}): void {
  if (error) {
    showErrorToast(error, options);
  } else {
    showSuccessToast("Изменения сохранены", options);
  }
}
