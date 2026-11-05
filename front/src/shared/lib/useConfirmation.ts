import React from "react";

/**
 * A question about `subject` before an action: `ask` opens it, shown while `pending` is set. The
 * action runs once the question has closed, since the page is inert until then and could not take
 * the focus.
 */
export function useConfirmation<TSubject>(onConfirmed: (subject: TSubject) => void) {
  const [pending, setPending] = React.useState<TSubject>();
  const confirmed = React.useRef<{ subject: TSubject }>(undefined);

  // After every render: the question, a child, has closed by then in its own effect.
  React.useEffect(() => {
    if (!confirmed.current) return;

    const { subject } = confirmed.current;

    confirmed.current = undefined;
    onConfirmed(subject);
  });

  return {
    ask: setPending as (subject: TSubject) => void,
    cancel() {
      setPending(undefined);
    },
    confirm() {
      if (pending !== undefined) confirmed.current = { subject: pending };
      setPending(undefined);
    },
    pending,
  };
}
