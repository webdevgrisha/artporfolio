import { toast } from "sonner";

const successDuration = 4_500;

/** The success message of a form save. */
export const savedMessage = "Изменения сохранены";

interface ToastOptions {
  /**
   * Toasts with the same id replace each other instead of piling up. The results of one action
   * share an id, so a repeated error or a later success replaces the previous toast.
   */
  id: string;
}

/** A change succeeded. The toast closes by itself. */
export function showSuccessToast(message: string, { id }: ToastOptions): void {
  toast.success(message, { duration: successDuration, id });
}

/** A request failed. The toast stays until it is closed, so the message cannot be missed. */
export function showErrorToast(message: string, { id }: ToastOptions): void {
  toast.error(message, { duration: Number.POSITIVE_INFINITY, id });
}

/** The result of saving a form: why something was not saved, or that everything was. */
export function showSaveResultToast(error: string | undefined, { id }: ToastOptions): void {
  if (error) {
    showErrorToast(error, { id });
  } else {
    showSuccessToast(savedMessage, { id });
  }
}
