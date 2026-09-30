import Link from "next/link";
import { ArrowLeft, Wrench } from "lucide-react";

import { Button } from "@/app/components/ui/button";

export default function SiteUnavailablePage() {
  return (
    <div className="state-page flex min-h-[80vh] flex-col items-center justify-center space-y-8 px-4 py-24 text-center">
      <div className="relative group">
        <div className="state-icon-glow absolute -inset-4 rounded-full bg-status-pending opacity-20 blur-xl transition-opacity duration-500 group-hover:opacity-35" />
        <div className="state-icon surface-card relative flex size-24 items-center justify-center rounded-full border-4 border-status-pending-line bg-status-pending-surface">
          <Wrench className="state-icon-glyph size-10" aria-hidden="true" />
        </div>
      </div>

      <div className="max-w-md space-y-3">
        <p className="state-label text-sm font-semibold uppercase tracking-[0.18em] text-status-pending-text">
          Temporarily unavailable
        </p>
        <h1 className="state-title text-2xl font-bold tracking-tight md:text-3xl">
          This site is down for maintenance
        </h1>
        <p className="state-body leading-7 text-muted-foreground">
          The project is temporarily unavailable while its host or server is
          being updated. Please check back later.
        </p>
      </div>

      <Button asChild variant="outline" className="min-h-11 rounded-full px-6">
        <Link href="/#projects">
          <ArrowLeft aria-hidden="true" />
          Back to projects
        </Link>
      </Button>
    </div>
  );
}
