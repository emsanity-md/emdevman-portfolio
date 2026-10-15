"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Download, X } from "lucide-react";

import { RESUME_FILENAME, RESUME_PATH } from "@/app/lib/resume";

/**
 * A preview of the résumé, over the page.
 *
 * A native `<dialog>`, for the same reasons `ProjectModal` uses one: `showModal()`
 * gives a focus trap, background inertness, the Escape key and a `::backdrop`
 * for free, and all four are things a hand-rolled overlay reliably gets wrong.
 * The `::backdrop` in particular is not reachable from the page's own stylesheet
 * once the dialog is open, so a custom overlay is the only way to get a
 * click-outside target that actually covers the viewport.
 *
 * An `<iframe>` rather than a PDF library. Every current browser renders PDF
 * natively, the file is 315KB, and `pdf.js` would be roughly 400KB of
 * JavaScript and a worker to do the same job - on a portfolio page, to show one
 * document the visitor has already decided they want to read.
 *
 * The iframe is not rendered until the dialog opens. Mounted permanently it
 * would be fetched on every page load by every visitor, nearly all of whom will
 * never press the button.
 */
export function ResumeModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog || !open) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;

    if (!dialog.open) dialog.showModal();

    /*
      The page behind is a scroll trap otherwise: `showModal` makes it inert, so
      a wheel event over the background goes to the document and scrolls the very
      content the dialog is meant to be sitting on top of.
    */
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
      if (dialog.open) dialog.close();
      /* Back to the button, so keyboard users are not dropped at the top. */
      previouslyFocused?.focus();
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open ? (
        <motion.dialog
          ref={dialogRef}
          aria-labelledby="resume-modal-title"
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onCancel={(event) => {
            /* Escape. preventDefault so React owns the close and the cleanup
               above runs, rather than the browser closing it underneath us. */
            event.preventDefault();
            onClose();
          }}
          onMouseDown={(event) => {
            /* The dialog element is the full-bleed backdrop layer, and the panel
               stops propagation - so a press that lands on the dialog itself is
               a press outside the panel. */
            if (event.target === event.currentTarget) onClose();
          }}
          className="fixed inset-0 m-0 h-[100dvh] max-h-none w-full max-w-none border-0 bg-transparent p-2 backdrop:bg-[var(--overlay-backdrop)] backdrop:backdrop-blur-sm sm:p-6"
        >
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, scale: 0.98, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 12 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="mx-auto flex h-[calc(100dvh-1rem)] w-full max-w-4xl flex-col overflow-hidden rounded-[0.75rem] border border-border bg-card shadow-2xl sm:h-auto sm:max-h-[calc(100dvh-3rem)]"
          >
            <header className="flex shrink-0 items-center gap-4 border-b border-border px-5 py-3.5">
              <div className="min-w-0">
                <h2
                  id="resume-modal-title"
                  className="font-display text-body font-medium text-foreground"
                >
                  Résumé
                </h2>
                <p className="mt-0.5 font-mono text-micro uppercase tracking-[0.12em] text-muted-foreground">
                  Emmanuel S. Bitancor · PDF
                </p>
              </div>

              <div className="ml-auto flex items-center gap-2">
                <a
                  href={RESUME_PATH}
                  download={RESUME_FILENAME}
                  className="inline-flex h-9 items-center gap-2 rounded-full bg-primary px-4 text-small font-medium text-primary-foreground outline-none transition-colors hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                >
                  <Download className="size-4" aria-hidden="true" />
                  Download
                </a>

                <button
                  type="button"
                  onClick={onClose}
                  className="inline-flex size-9 items-center justify-center rounded-full border border-border text-muted-foreground outline-none transition-colors hover:border-primary/40 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  aria-label="Close résumé preview"
                >
                  <X className="size-4" aria-hidden="true" />
                </button>
              </div>
            </header>

            {/*
              `aspect-[8.5/11]` is US Letter, which is what a two-page A4/Letter
              résumé is exported from in practice. Fixing the ratio rather than
              letting the frame size itself means the panel does not jump when
              the document loads, and the browser's own PDF toolbar still has
              room for page navigation and zoom.

              `title` is not decoration: an iframe without one is announced as an
              unnamed frame and a screen reader user has no way to know what they
              have landed in.
            */}
            <div className="min-h-0 flex-1 overflow-hidden bg-muted p-2 sm:p-4">
              <iframe
                src={RESUME_PATH}
                title="Résumé of Emmanuel S. Bitancor"
                className="h-full min-h-[60vh] w-full rounded-[0.5rem] border border-border bg-white"
              />
            </div>
          </motion.div>
        </motion.dialog>
      ) : null}
    </AnimatePresence>
  );
}