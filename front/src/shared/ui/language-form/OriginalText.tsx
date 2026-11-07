import React from "react";

import { Button } from "@/shared/ui/button";

import styles from "./LanguageForm.module.css";

interface OriginalTextProps {
  /** The Russian text of the field. */
  original: string;
  /** What the field says about its translation. */
  status: string;
  /** The id `aria-describedby` of the field refers to. */
  statusId: string;
}

/**
 * The line under a translation: its status and, folded away as a description may be long, the
 * Russian text to compare it with.
 */
export function OriginalText({ original, status, statusId }: OriginalTextProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const textId = React.useId();

  return (
    <>
      <div className={styles.meta}>
        <span id={statusId}>{status}</span>
        <Button
          className={styles.toggle}
          variant="text"
          aria-controls={textId}
          aria-expanded={isOpen}
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? "Скрыть оригинал" : "Показать оригинал"}
        </Button>
      </div>
      {/* Russian reads from left to right even in the form of a language that does not. */}
      <div id={textId} className={styles.original} dir="ltr" hidden={!isOpen}>
        <p className={styles.originalLabel}>Оригинал</p>
        <p className={styles.originalText}>{original}</p>
      </div>
    </>
  );
}
