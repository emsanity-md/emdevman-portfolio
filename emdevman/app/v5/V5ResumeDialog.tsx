"use client";

import { useEffect, useRef } from "react";
import { Download, X } from "lucide-react";

import { RESUME_FILENAME, RESUME_PATH } from "@/app/lib/resume";

/**
 * The résumé preview, over the v5 page.
 *
 * A native `<dialog>` for the focus trap, Escape handling, inert background and
 * top-layer backdrop. The PDF is mounted only while the dialog is open, so the
 * document is not fetched on every visit to the page.
 */
export function V5ResumeDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || !open) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;

    if (!dialog.open) dialog.showModal();
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
      if (dialog.open) dialog.close();
      previouslyFocused?.focus();
    };
  }, [open]);

  return (
    <dialog
      ref={dialogRef}
      className="v5-resume-dialog"
      aria-labelledby="v5-resume-title"
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onMouseDown={(event) => {
        /*
          The dialog element is the full-bleed backdrop layer; the panel inside
          stops being the target for presses outside it.
        */
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="v5-resume-dialog__panel">
        <header className="v5-resume-dialog__header">
          <div>
            <h2 id="v5-resume-title" className="v5-resume-dialog__title">
              Résumé
            </h2>
            <p className="v5-resume-dialog__subtitle">
              Emmanuel S. Bitancor · PDF
            </p>
          </div>

          <div className="v5-resume-dialog__actions">
            <a
              className="v5-resume-dialog__download"
              href={RESUME_PATH}
              download={RESUME_FILENAME}
            >
              <Download aria-hidden="true" />
              Download
            </a>
            <button
              type="button"
              className="v5-resume-dialog__close"
              onClick={onClose}
              aria-label="Close résumé preview"
            >
              <X aria-hidden="true" />
            </button>
          </div>
        </header>

        <div className="v5-resume-dialog__viewer">
          {open ? (
            <iframe
              src={RESUME_PATH}
              title="Résumé of Emmanuel S. Bitancor"
              className="v5-resume-dialog__iframe"
            />
          ) : null}
        </div>
      </div>
    </dialog>
  );
}
