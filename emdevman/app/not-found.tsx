import Link from "next/link";
import { ArrowLeft, FileQuestion } from "lucide-react";

import { Button } from "@/app/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center space-y-7 px-4 py-24 text-center">
      <div className="flex size-24 items-center justify-center rounded-full border border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
        <FileQuestion className="size-10 text-zinc-600 dark:text-zinc-300" aria-hidden="true" />
      </div>
      <div className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-zinc-500 dark:text-zinc-400">
          404
        </p>
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">Page not found</h1>
        <p className="max-w-md leading-7 text-zinc-500 dark:text-zinc-400">
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
