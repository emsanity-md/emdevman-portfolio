import Link from "next/link";
import { ArrowLeft, LockKeyhole, Mail } from "lucide-react";

import { Button } from "@/app/components/ui/button";
import { EMAIL_MAILTO } from "@/app/lib/contact";

interface PrivatePageProps {
  searchParams: Promise<{ project?: string | string[] }>;
}

export default async function PrivateAccessPage({ searchParams }: PrivatePageProps) {
  const params = await searchParams;
  const rawProject = Array.isArray(params.project) ? params.project[0] : params.project;
  const projectName = rawProject?.trim().slice(0, 100) || "this project";

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center space-y-8 px-4 py-24 text-center">
      <div className="relative group">
        <div className="absolute -inset-4 rounded-full bg-amber-500 opacity-20 blur-xl transition-opacity duration-500 group-hover:opacity-35" />
        <div className="relative flex size-24 items-center justify-center rounded-full border-4 border-amber-100 bg-amber-50/70 shadow-xl dark:border-amber-900/50 dark:bg-amber-900/20">
          <LockKeyhole className="size-10 text-amber-600 dark:text-amber-500" aria-hidden="true" />
        </div>
      </div>

      <div className="max-w-md space-y-3">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-amber-700 dark:text-amber-400">
          Private source
        </p>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 md:text-3xl dark:text-zinc-50">
          {projectName} isn&apos;t public yet
        </h1>
        <p className="leading-7 text-zinc-500 dark:text-zinc-400">
          The source code is private or shared under agreement. You can request
          access to the case study or implementation details.
        </p>
      </div>

      <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
        <Button asChild variant="outline" className="min-h-11 rounded-full px-6">
          <Link href="/#projects">
            <ArrowLeft aria-hidden="true" />
            Back to projects
          </Link>
        </Button>
        <Button asChild className="min-h-11 rounded-full px-6">
          <a href={EMAIL_MAILTO}>
            <Mail aria-hidden="true" />
            Request access
          </a>
        </Button>
      </div>
    </div>
  );
}
