import Link from "next/link";
import { ArrowLeft, Wrench } from "lucide-react";

import { Button } from "@/app/components/ui/button";

export default function SiteUnavailablePage() {
  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center space-y-8 px-4 py-24 text-center">
      <div className="relative group">
        <div className="absolute -inset-4 rounded-full bg-amber-500 opacity-20 blur-xl transition-opacity duration-500 group-hover:opacity-35" />
        <div className="relative flex size-24 items-center justify-center rounded-full border-4 border-amber-100 bg-amber-50/70 shadow-xl dark:border-amber-900/50 dark:bg-amber-900/20">
          <Wrench className="size-10 text-amber-600 dark:text-amber-500" aria-hidden="true" />
        </div>
      </div>

      <div className="max-w-md space-y-3">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-700 dark:text-amber-400">
          Temporarily unavailable
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 md:text-3xl dark:text-zinc-50">
          This site is down for maintenance
        </h1>
        <p className="leading-7 text-zinc-500 dark:text-zinc-400">
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
