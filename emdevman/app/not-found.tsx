import Link from "next/link";
import { ArrowLeft, FileQuestion } from "lucide-react";

import { Button } from "@/app/components/ui/button";

export default function NotFound() {
  return (
    <div className="state-page flex min-h-[80vh] flex-col items-center justify-center space-y-7 px-4 py-24 text-center">
      <div className="state-icon surface-card flex size-24 items-center justify-center rounded-full border border-border bg-card">
        <FileQuestion className="state-icon-glyph size-10" aria-hidden="true" />
      </div>
      <div className="space-y-3">
        <p className="state-label text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          404
        </p>
        <h1 className="state-title text-3xl font-bold tracking-tight md:text-4xl">Page not found</h1>
        <p className="state-body max-w-md leading-7 text-muted-foreground">
          The page may have moved, or the address may be incorrect.
        </p>
      </div>
      <Button asChild className="min-h-11 rounded-full px-6">
        <Link href="/">
          <ArrowLeft aria-hidden="true" />
          Return home
        </Link>
      </Button>
    </div>
  );
}
