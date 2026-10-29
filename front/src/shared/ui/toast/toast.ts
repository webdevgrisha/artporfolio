import { toast } from "sonner";

const successDuration = 4_500;

interface ToastOptions {
  /**
   * Toasts with the same id replace each other instead of piling up. The results of one action
   * share an id, so a repeated error or a later success replaces the previous toast.
   */
  id: string;
}

/**
 * The result of saving a form: why something was not saved, or that everything was. An error
 * stays until it is closed, so the message cannot be missed.
 */
export function showSaveResultToast(error: string | undefined, { id }: ToastOptions): void {
  if (error) {
    toast.error(error, { duration: Number.POSITIVE_INFINITY, id });
  } else {
    toast.success("Изменения сохранены", { duration: successDuration, id });
  }
}

/** An action other than saving a form failed. It stays until it is closed, like a save error. */
export function showErrorToast(message: string, { id }: ToastOptions): void {
  toast.error(message, { duration: Number.POSITIVE_INFINITY, id });
}
