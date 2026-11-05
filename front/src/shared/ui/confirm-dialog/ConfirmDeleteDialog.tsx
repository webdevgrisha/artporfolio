import { ConfirmDialog } from "./ConfirmDialog";

interface ConfirmDeleteDialogProps {
  /** What the deletion does; say when it cannot be undone. */
  description: string;
  isOpen: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  title: string;
}

/** The question before a deletion. */
export function ConfirmDeleteDialog(props: ConfirmDeleteDialogProps) {
  return <ConfirmDialog {...props} cancelLabel="Отмена" confirmLabel="Удалить" />;
}
