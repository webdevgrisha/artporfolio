import React from "react";

import { useFocusAfterUpdate } from "@/shared/lib/useFocusAfterUpdate";
import { Button } from "@/shared/ui/button";

import styles from "./TablePagination.module.css";

interface TablePaginationProps {
  onChange: (page: number) => void;
  /** From 1. */
  page: number;
  pageCount: number;
}

/** The pages of a long table, one step at a time. */
export function TablePagination({ onChange, page, pageCount }: TablePaginationProps) {
  const previousRef = React.useRef<HTMLButtonElement>(null);
  const nextRef = React.useRef<HTMLButtonElement>(null);
  const focusAfterUpdate = useFocusAfterUpdate();

  function open(target: number) {
    onChange(target);
    // The pressed button goes disabled at the end of the list, and would drop the focus.
    focusAfterUpdate(() => {
      if (target === 1) nextRef.current?.focus();
      if (target === pageCount) previousRef.current?.focus();
    });
  }

  return (
    <nav className={styles.root} aria-label="Страницы таблицы">
      <Button ref={previousRef} disabled={page === 1} onClick={() => open(page - 1)}>
        Назад
      </Button>
      <span aria-live="polite">
        Страница {page} из {pageCount}
      </span>
      <Button ref={nextRef} disabled={page === pageCount} onClick={() => open(page + 1)}>
        Вперёд
      </Button>
    </nav>
  );
}
