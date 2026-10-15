"use client";

import { useState } from "react";
import { FileText } from "lucide-react";

import { ResumeModal } from "./ResumeModal";

/**
 * The hero's résumé control: a button that previews, and a modal that downloads.
 *
 * Both halves live here rather than in `V2Hero` because opening a dialog is
 * state, and the hero is a server component. Putting the two of them together in
 * one client component makes the island exactly as large as the interaction -
 * a button and a dialog - instead of turning the hero's name, tagline, two CTAs
 * and the profile card into a hydration boundary for the sake of one `useState`.
 *
 * The label says "View résumé" rather than "Download", because pressing it does
 * not download anything. A control whose label misdescribes what it does is the
 * one kind of lie an interface should not tell, and the download is one click
 * away inside the modal - which is where anyone who wanted it will be a moment
 * later anyway.
 */
export function ResumeButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-border bg-card px-5 text-small font-medium text-foreground outline-none transition-colors hover:border-primary/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <FileText className="size-4" aria-hidden="true" />
        View résumé
      </button>

      <ResumeModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}