import React from "react";

/** A pause in typing long enough to write the search into the address. */
const saveDelayMs = 300;

/**
 * The text of the search of a table. The field cannot wait for the address: a change of it is an
 * asynchronous navigation, and until it ends React would put the old text back into the field,
 * which moves the caret and loses letters on a busy device. So the field keeps what is typed, and
 * `onSave` writes it into the address once the typing pauses.
 */
export function useTableSearch(addressQuery: string, onSave: (query: string) => void) {
  // What is typed and not in the address yet.
  const [typed, setTyped] = React.useState<string>();
  const save = React.useEffectEvent(onSave);

  if (typed === addressQuery) {
    setTyped(undefined);
  }

  React.useEffect(() => {
    if (typed === undefined) return;

    const timeout = setTimeout(() => save(typed), saveDelayMs);

    return () => clearTimeout(timeout);
  }, [typed]);

  return {
    changeQuery: setTyped as (query: string) => void,
    /** Drops what the address does not have yet, for a change that sets the search itself. */
    forgetTyped: () => setTyped(undefined),
    query: typed ?? addressQuery,
  };
}
