import React from "react";

import { type FileRules, getFileRejection } from "@/shared/lib/getFileRejection";
import { joinMessages } from "@/shared/lib/joinMessages";

interface UseMediaListFilesParams {
  itemCount: number;
  maxItems: number;
  onAdd: (files: File[]) => void;
  onRejectionChange: (message: string | undefined) => void;
  onReplace: (id: string, file: File) => void;
  rules: FileRules;
}

/** Checks the files picked or dropped for a list, and reports the accepted ones and the refusals. */
export function useMediaListFiles({
  itemCount,
  maxItems,
  onAdd,
  onRejectionChange,
  onReplace,
  rules,
}: UseMediaListFilesParams) {
  const addInputRef = React.useRef<HTMLInputElement>(null);
  const replaceInputRef = React.useRef<HTMLInputElement>(null);
  const replacedItemIdRef = React.useRef<string>(undefined);

  function addFiles(fileList: FileList) {
    const rejections = new Set<string>();
    const accepted: File[] = [];

    for (const file of Array.from(fileList)) {
      const fileRejection = getFileRejection(file, rules);
      if (fileRejection) {
        rejections.add(fileRejection);
      } else {
        accepted.push(file);
      }
    }

    const room = maxItems - itemCount;
    if (accepted.length > room) {
      rejections.add(`Можно добавить не больше ${String(maxItems)} фото`);
      accepted.splice(room);
    }

    onRejectionChange(joinMessages(rejections));
    if (accepted.length > 0) onAdd(accepted);
  }

  function replaceFile(fileList: FileList) {
    const [file] = Array.from(fileList);
    const itemId = replacedItemIdRef.current;
    if (!file || !itemId) return;

    const fileRejection = getFileRejection(file, rules);

    onRejectionChange(fileRejection);
    if (!fileRejection) onReplace(itemId, file);
  }

  function openReplacePicker(itemId: string) {
    replacedItemIdRef.current = itemId;
    replaceInputRef.current?.click();
  }

  return { addFiles, addInputRef, openReplacePicker, replaceFile, replaceInputRef };
}
